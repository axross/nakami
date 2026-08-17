#!/usr/bin/env node
// scenario-coverage gate for the Maestro e2e suite.
//
// reads the journey catalog (e2e/scenarios.md) and every flow under
// e2e/flows/, then verifies each cataloged scenario ID is claimed by at least
// one flow via a `scenario:<id>` entry in the flow-config `tags:` list.
//
// exit is non-zero on structural errors (a flow tags a scenario that is not
// cataloged, an empty catalog) and on any uncovered `must`-priority scenario.
// uncovered `should` / `may` scenarios are report-only.

import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const e2eDir = dirname(fileURLToPath(import.meta.url));

const catalogSource = await readFile(join(e2eDir, "scenarios.md"), "utf-8");
const catalog = new Map(
	[
		...catalogSource.matchAll(
			/^\|\s*`([a-z0-9.-]+)`\s*\|\s*(must|should|may)\s*\|/gm,
		),
	].map((m) => [m[1], m[2]]),
);

if (catalog.size === 0) {
	console.error(
		"e2e/scenarios.md lists no scenarios — the catalog is empty or a row is malformed (expected | `id` | must/should/may | journey |).",
	);
	process.exit(1);
}

const flowsDir = join(e2eDir, "flows");
const flowFiles = (await readdir(flowsDir, { recursive: true })).filter((f) =>
	/\.ya?ml$/.test(f),
);

const covered = new Map();
for (const file of flowFiles) {
	const source = await readFile(join(flowsDir, file), "utf-8");
	// only the flow config (before the first `---`) declares tags.
	const config = source.split(/^---$/m)[0];
	for (const match of config.matchAll(/scenario:([a-z0-9.-]+)/g)) {
		const id = match[1];
		covered.set(id, [...(covered.get(id) ?? []), file]);
	}
}

const unknown = [...covered.keys()].filter((id) => !catalog.has(id));
const uncoveredMust = [];
const uncoveredOther = [];
for (const [id, priority] of catalog) {
	if (covered.has(id)) {
		continue;
	}
	(priority === "must" ? uncoveredMust : uncoveredOther).push(id);
}

for (const id of unknown) {
	console.error(
		`Flow(s) ${covered.get(id).join(", ")} tag scenario \`${id}\`, which is not in e2e/scenarios.md.`,
	);
}
for (const id of uncoveredMust) {
	console.error(
		`must-priority scenario \`${id}\` has no asserting flow (tag scenario:${id}).`,
	);
}
for (const id of uncoveredOther) {
	console.warn(
		`(report-only) ${catalog.get(id)}-priority scenario \`${id}\` has no asserting flow yet.`,
	);
}

if (unknown.length > 0 || uncoveredMust.length > 0) {
	process.exit(1);
}

console.log(
	`Scenario coverage OK: ${catalog.size - uncoveredOther.length}/${catalog.size} scenarios asserted across ${flowFiles.length} flow(s); all must-priority journeys covered.`,
);
