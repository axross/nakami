// Runner-agnostic scenario-coverage core.
//
// Two pure functions that know nothing about Maestro, YAML, or the file
// system. `parseScenarioCatalog` turns the journey catalog's markdown into a
// map of scenario id to its catalog facets; `evaluateScenarioCoverage` joins
// that map against a normalized `{ title, tags, status }[]` — one entry per
// test the runner produced — and returns the structural errors, the facet
// mismatches, and the covered/uncovered split.
//
// A per-runner adapter maps its own report into that array and reports what
// comes back, so switching runners replaces the adapter and leaves the join
// and the gate conditions untouched.

const REQUIRED_COLUMNS = ["id", "title", "area", "priority"];
const PRIORITIES = ["must", "should", "may"];
const FACETS = ["area", "priority"];
// Lower-case words joined by `.` or `-`, as the catalog's dotted ids are
// written (`auth.last-server-url`).
const ID_PATTERN = /^[a-z0-9]+(?:[.-][a-z0-9]+)*$/;

/** Splits one markdown table row into trimmed cells, or `null` if it is not a row. */
function tableCells(line) {
	const trimmed = line.trim();
	if (!trimmed.startsWith("|")) {
		return null;
	}

	const inner = trimmed.slice(1, trimmed.endsWith("|") ? -1 : undefined);

	return inner.split("|").map((cell) => cell.trim());
}

/** Whether these cells are a table's `| --- | --- |` delimiter row. */
function isDelimiterRow(cells) {
	return cells?.every((cell) => /^:?-+:?$/.test(cell)) ?? false;
}

/** Strips the backticks a catalog cell may wrap a value in. */
function stripBackticks(value) {
	const trimmed = value.trim();

	return /^`.*`$/s.test(trimmed) ? trimmed.slice(1, -1).trim() : trimmed;
}

/** Capitalizes the caller's noun for the thing a finding is about. */
function describe(subject, title) {
	return `${subject.charAt(0).toUpperCase()}${subject.slice(1)} "${title}"`;
}

/**
 * Parses a journey catalog written as markdown into
 * `Map<id, { title, area, priority }>` plus the rows it could not read.
 *
 * The table is found by its header rather than by position: the first row
 * naming all of `Id`, `Title`, `Area`, and `Priority` — case-insensitively, in
 * any order — is the catalog, and any further column is ignored, so a project
 * can add one without touching this parser. A returned error means the catalog
 * itself is unusable; the caller decides what to do about that.
 */
export function parseScenarioCatalog(source) {
	const errors = [];
	const scenarios = new Map();
	const lines = source.split(/\r?\n/);

	let columns = null;
	let firstRow = 0;
	for (let index = 0; index + 1 < lines.length; index++) {
		const header = tableCells(lines[index]);
		if (header === null || !isDelimiterRow(tableCells(lines[index + 1]))) {
			continue;
		}

		const positions = new Map(
			header.map((cell, position) => [cell.toLowerCase(), position]),
		);
		if (REQUIRED_COLUMNS.every((column) => positions.has(column))) {
			columns = positions;
			firstRow = index + 2;
			break;
		}
	}

	if (columns === null) {
		errors.push(
			`no journey table found — expected a markdown table whose header names ${REQUIRED_COLUMNS.join(", ")} (case-insensitive, in any order; further columns are ignored).`,
		);

		return { scenarios, errors };
	}

	for (let index = firstRow; index < lines.length; index++) {
		const cells = tableCells(lines[index]);
		if (cells === null) {
			break;
		}

		const at = `line ${index + 1}`;
		const cell = (column) => stripBackticks(cells[columns.get(column)] ?? "");
		const id = cell("id");
		const title = cell("title");
		const area = cell("area");
		const priority = cell("priority").toLowerCase();

		if (!ID_PATTERN.test(id)) {
			errors.push(
				`${at}: \`${id}\` is not a usable scenario id — expected lower-case words joined by \`.\` or \`-\`.`,
			);
		} else if (scenarios.has(id)) {
			errors.push(`${at}: scenario \`${id}\` is cataloged more than once.`);
		} else if (title === "" || area === "") {
			errors.push(
				`${at}: scenario \`${id}\` is missing its title or its area.`,
			);
		} else if (!PRIORITIES.includes(priority)) {
			errors.push(
				`${at}: scenario \`${id}\` has priority \`${priority}\`, which is not one of ${PRIORITIES.join(" | ")}.`,
			);
		} else {
			scenarios.set(id, { title, area, priority });
		}
	}

	if (scenarios.size === 0 && errors.length === 0) {
		errors.push("the journey table has no rows — the catalog is empty.");
	}

	return { scenarios, errors };
}

/**
 * Reads the join and facet tags off one normalized result. A leading `@` is
 * optional, so a runner that writes `@scenario:id` joins the same as one that
 * writes `scenario:id`.
 */
function readTags(tags) {
	const scenarios = [];
	const facets = [];

	for (const tag of tags ?? []) {
		const token = String(tag).trim().replace(/^@/, "");
		const separator = token.indexOf(":");
		if (separator === -1) {
			continue;
		}

		const kind = token.slice(0, separator).toLowerCase();
		const value = token.slice(separator + 1).trim();
		if (kind === "scenario") {
			scenarios.push(value);
		} else if (FACETS.includes(kind)) {
			facets.push({ kind, value });
		}
	}

	return { scenarios, facets };
}

/**
 * Joins a parsed catalog against a normalized `{ title, tags, status }[]`.
 *
 * A scenario counts as covered when a result carrying its tag did not fail and
 * was not skipped, so an adapter that later observes a real run supplies true
 * statuses without any change here. `subject` names what a result is in the
 * runner's own vocabulary — a Maestro adapter passes `"flow"` — and only
 * shapes the wording of a finding.
 */
export function evaluateScenarioCoverage({
	scenarios: catalog,
	results,
	subject = "test",
}) {
	const errors = [];
	const facetMismatches = [];
	const covered = new Set();

	for (const result of results) {
		const what = describe(subject, result.title);
		const { scenarios, facets } = readTags(result.tags);
		const asserted = result.status !== "failed" && result.status !== "skipped";

		for (const id of scenarios) {
			if (!catalog.has(id)) {
				errors.push(
					`${what} tags scenario \`${id}\`, which the catalog does not list.`,
				);
			} else if (asserted) {
				covered.add(id);
			}
		}

		if (facets.length > 0 && scenarios.length === 0) {
			const carried = facets
				.map(({ kind, value }) => `\`${kind}:${value}\``)
				.join(", ");
			errors.push(
				`${what} carries ${carried} but no \`scenario:\` tag, so there is no catalog row to check the facet against.`,
			);
			continue;
		}

		for (const { kind, value } of facets) {
			for (const id of scenarios) {
				const row = catalog.get(id);
				if (row === undefined || row[kind] === value) {
					continue;
				}

				facetMismatches.push(
					`${what} carries \`${kind}:${value}\`, but the catalog gives scenario \`${id}\` \`${kind}:${row[kind]}\`.`,
				);
			}
		}
	}

	const uncoveredMust = [];
	const uncoveredOther = [];
	for (const [id, { priority }] of catalog) {
		if (covered.has(id)) {
			continue;
		}

		(priority === "must" ? uncoveredMust : uncoveredOther).push({
			id,
			priority,
		});
	}

	return { errors, facetMismatches, covered, uncoveredMust, uncoveredOther };
}
