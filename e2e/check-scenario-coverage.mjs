#!/usr/bin/env node
// scenario-coverage gate for the Maestro e2e suite.
//
// the Maestro adapter over the runner-agnostic core in ./scenario-coverage.mjs:
// it reads the journey catalog (e2e/scenarios.md), maps every flow under
// e2e/flows/ into the core's normalized `{ title, tags, status }` shape, and
// reports what the core finds.
//
// every flow is reported with status "declared". this gate reads files and
// never launches the app — which is what lets it run where no simulator
// exists — so it has observed no execution and says so rather than claiming a
// pass. that is also why a green gate proves tag bookkeeping only, and never
// that a journey passes.
//
// exit is non-zero on a structural tag error (a flow tagging an uncataloged
// scenario, or carrying a facet tag with no scenario tag to check it against),
// on a facet tag that disagrees with the catalog, on an empty or malformed
// catalog, and on any uncovered `must`-priority scenario. uncovered `should` /
// `may` scenarios are report-only.

import { readdir, readFile } from "node:fs/promises";
import { dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";
import {
	evaluateScenarioCoverage,
	parseScenarioCatalog,
} from "./scenario-coverage.mjs";

/** Whether a YAML scalar is written in quotes, so its content is literal. */
function isQuoted(value) {
	return /^(".*"|'.*')$/s.test(value);
}

/** Strips the quotes a YAML scalar may be written with. */
function stripQuotes(value) {
	const trimmed = value.trim();

	return isQuoted(trimmed) ? trimmed.slice(1, -1) : trimmed;
}

/**
 * strips the `# …` comment a YAML scalar may be followed by. a quoted scalar
 * may hold a `#` of its own, so only an unquoted value is cut, and only at a
 * `#` that starts a token rather than one sitting inside a word.
 */
function stripComment(value) {
	const trimmed = value.trim();

	return isQuoted(trimmed)
		? trimmed
		: trimmed.replace(/(^|\s)#.*$/s, "").trim();
}

/** Whether a line inside a block sequence holds no entry — blank, or a comment. */
function isBlankOrComment(line) {
	return /^[ \t]*(#.*)?$/.test(line);
}

/** Reads a flow config's `name:` — Maestro's own label for the flow. */
function readFlowName(config) {
	const match = config.match(/^name:[ \t]*(.*)$/m);

	return match === null ? "" : stripQuotes(match[1]);
}

/**
 * reads a flow config's `tags:` entries. Maestro declares them as a YAML block
 * sequence; the inline `[a, b]` form is accepted too.
 *
 * a blank line or a whole-line comment inside the block is skipped rather than
 * ending it, and a trailing comment is stripped off an entry — the flows here
 * carry comments, and reading a commented flow as untagged would skip the very
 * checks this gate exists to run.
 */
function readFlowTags(config) {
	const tags = [];
	let inList = false;

	for (const line of config.split(/\r?\n/)) {
		const header = line.match(/^tags:[ \t]*(.*)$/);
		if (header !== null) {
			const value = header[1].trim();
			// the inline form ends at its closing bracket; a comment may follow.
			const closing = value.startsWith("[") ? value.lastIndexOf("]") : -1;
			inList = closing === -1;
			if (!inList) {
				tags.push(
					...value
						.slice(1, closing)
						.split(",")
						.map((entry) => stripQuotes(stripComment(entry)))
						.filter((tag) => tag !== ""),
				);
			}
			continue;
		}

		if (!inList || isBlankOrComment(line)) {
			continue;
		}

		const item = line.match(/^[ \t]*-[ \t]*(.+)$/);
		if (item === null) {
			inList = false;
			continue;
		}

		const tag = stripQuotes(stripComment(item[1]));
		if (tag !== "") {
			tags.push(tag);
		}
	}

	return tags;
}

const e2eDir = dirname(fileURLToPath(import.meta.url));
const catalogFile = "scenarios.md";

const { scenarios, errors: catalogErrors } = parseScenarioCatalog(
	await readFile(join(e2eDir, catalogFile), "utf-8"),
);

if (catalogErrors.length > 0) {
	// reported repository-relative, so the path is the same wherever it ran.
	for (const error of catalogErrors) {
		console.error(`e2e/${catalogFile}: ${error}`);
	}
	process.exit(1);
}

const flowsDir = join(e2eDir, "flows");
const flowFiles = (await readdir(flowsDir, { recursive: true }))
	.filter((file) => /\.ya?ml$/.test(file))
	.sort();

const results = await Promise.all(
	flowFiles.map(async (file) => {
		const source = await readFile(join(flowsDir, file), "utf-8");
		// only the flow config — everything above the first `---` — declares tags.
		const config = source.split(/^---$/m)[0];
		const path = `e2e/flows/${file.split(sep).join("/")}`;
		const name = readFlowName(config);

		return {
			// both, because neither identifies a flow on its own: two flows may
			// share a `name:`, and CI has no tree for the reader to grep. the
			// path is repository-relative, so it reads the same wherever it ran.
			title: name === "" ? path : `${name} (${path})`,
			tags: readFlowTags(config),
			status: "declared",
		};
	}),
);

const { errors, facetMismatches, covered, uncoveredMust, uncoveredOther } =
	evaluateScenarioCoverage({ scenarios, results, subject: "flow" });

for (const message of [...errors, ...facetMismatches]) {
	console.error(message);
}
for (const { id } of uncoveredMust) {
	console.error(
		`must-priority scenario \`${id}\` has no asserting flow (tag scenario:${id}).`,
	);
}
for (const { id, priority } of uncoveredOther) {
	console.warn(
		`(report-only) ${priority}-priority scenario \`${id}\` has no asserting flow yet.`,
	);
}

if (
	errors.length > 0 ||
	facetMismatches.length > 0 ||
	uncoveredMust.length > 0
) {
	process.exit(1);
}

console.log(
	`Scenario coverage OK: ${covered.size}/${scenarios.size} scenarios asserted across ${flowFiles.length} flow(s); all must-priority journeys covered.`,
);
