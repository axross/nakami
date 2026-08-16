#!/usr/bin/env node
// Scenario-coverage gate for the Maestro e2e suite.
//
// The Maestro adapter over the runner-agnostic core in ./scenario-coverage.mjs:
// it reads the journey catalog (e2e/scenarios.md), maps every flow under
// e2e/flows/ into the core's normalized `{ title, tags, status }` shape, and
// reports what the core finds.
//
// Every flow is reported with status "declared". This gate reads files and
// never launches the app — which is what lets it run where no simulator
// exists — so it has observed no execution and says so rather than claiming a
// pass. That is also why a green gate proves tag bookkeeping only, and never
// that a journey passes.
//
// Exit is non-zero on a structural tag error (a flow tagging an uncataloged
// scenario, or carrying a facet tag with no scenario tag to check it against),
// on a facet tag that disagrees with the catalog, on an empty or malformed
// catalog, and on any uncovered `must`-priority scenario. Uncovered `should` /
// `may` scenarios are report-only.

import { readdir, readFile } from "node:fs/promises";
import { dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";
import {
	evaluateScenarioCoverage,
	parseScenarioCatalog,
} from "./scenario-coverage.mjs";

/** Strips the quotes a YAML scalar may be written with. */
function stripQuotes(value) {
	const trimmed = value.trim();

	return /^(".*"|'.*')$/s.test(trimmed) ? trimmed.slice(1, -1) : trimmed;
}

/** Reads a flow config's `name:` — Maestro's own label for the flow. */
function readFlowName(config) {
	const match = config.match(/^name:[ \t]*(.*)$/m);

	return match === null ? "" : stripQuotes(match[1]);
}

/**
 * Reads a flow config's `tags:` entries. Maestro declares them as a YAML block
 * sequence; the inline `[a, b]` form is accepted too.
 */
function readFlowTags(config) {
	const tags = [];
	let inList = false;

	for (const line of config.split(/\r?\n/)) {
		const header = line.match(/^tags:[ \t]*(.*)$/);
		if (header !== null) {
			const inline = header[1].trim();
			inList = !(inline.startsWith("[") && inline.endsWith("]"));
			if (!inList) {
				tags.push(
					...inline
						.slice(1, -1)
						.split(",")
						.map(stripQuotes)
						.filter((tag) => tag !== ""),
				);
			}
			continue;
		}

		if (!inList) {
			continue;
		}

		const item = line.match(/^[ \t]*-[ \t]*(.+)$/);
		if (item === null) {
			inList = false;
		} else {
			tags.push(stripQuotes(item[1]));
		}
	}

	return tags;
}

const e2eDir = dirname(fileURLToPath(import.meta.url));
const catalogPath = "e2e/scenarios.md";

const { scenarios, errors: catalogErrors } = parseScenarioCatalog(
	await readFile(join(e2eDir, "scenarios.md"), "utf-8"),
);

if (catalogErrors.length > 0) {
	for (const error of catalogErrors) {
		console.error(`${catalogPath}: ${error}`);
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
		// Only the flow config — everything above the first `---` — declares tags.
		const config = source.split(/^---$/m)[0];
		const path = `e2e/flows/${file.split(sep).join("/")}`;

		return {
			title: readFlowName(config) || path,
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
