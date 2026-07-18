# E2E Scenario Coverage

Apply these rules when tagging tests, extending the journey catalog, or reading the coverage report. This project measures e2e coverage as **scenario coverage** — which real user journeys the Maestro suite *asserts* — not lines of application code executed.

## Why Scenario Coverage, Not E2E Line Coverage

Scenario coverage is a deliberate choice over instrumenting the app and collecting e2e *line* coverage. Line coverage was rejected because:

- **Noisy and gameable.** Executed ≠ asserted: a line runs when a test merely walks past it, so line coverage overstates how well journeys are *verified*.
- **Slow and heavy.** It needs an instrumented coverage build, which is fragile under modern bundlers and slows the default e2e run. Scenario coverage is pure bookkeeping over test tags, so it adds near-zero cost.
- **Cannot express gaps.** Line coverage has no notion of an *intended* journey nobody has tested yet, so it can never say "the cancel journey is untested." A traceability catalog can — that visible-gap capability is the whole point.

The trade-off: the denominator is a **human judgment call** — an incomplete catalog inflates the percentage — so the catalog is reviewed alongside the code, and only critical journeys are hard-gated.

## Mechanism

Three pieces, joined by a stable scenario id:

- **Catalog** — the human-authored journey list `e2e/scenarios.md` with one row per journey: a stable kebab-case id (dots allowed for hierarchy, e.g. `feeds.create`), a priority of `must` | `should` | `may`, and the journey description.
- **Tags** — each flow declares which journeys it asserts via `scenario:<id>` entries in its flow-config `tags:` list (a flow can carry several). Additional plain tags (e.g. `smoke`) MAY be used with `maestro test --include-tags` for filtered runs.
- **Gate** — `e2e/check-scenario-coverage.mjs` (run via `npm run test:e2e:coverage`, and as the first step of `npm run test:e2e`) tallies, for every catalog row, whether at least one flow carries its scenario tag, prints `covered/total` and the uncovered list, and exits non-zero on an uncovered `must` scenario or a structural tag error. Whether the tagged flows *pass* is enforced by the Maestro run that follows the gate in `npm run test:e2e`.

**Guidelines:**

- MUST author the catalog as a human-reviewable file, not a list in code, so journey completeness is judged in review.
- MUST add a catalog row when a change introduces a new user-facing journey, in the same change as the test that asserts it.
- MUST tag the test that **asserts** the journey's outcome — never a test that merely passes through the journey on its way elsewhere; executed ≠ asserted, and a tag on a pass-through test overstates coverage.
- MUST NOT rename a scenario id without updating every tag that references it in the same change — the id is the contract between catalog and tests.
- MUST keep any selection tags (e.g. `smoke`) consistent with the flow's actual role, so filtered runs stay trustworthy.
- SHOULD keep genuinely-untested journeys in the catalog with an honest priority so the report shows real gaps; writing tests for surfaced gaps is follow-up work, not a prerequisite for reading the metric.
- MUST NOT treat a green coverage gate alone as e2e verification — the gate checks tag bookkeeping; only the Maestro run proves the journeys pass.

## Phased Gate

Gating in phases lets the metric land before coverage is complete: pin the critical journeys first, grow breadth without blocking every merge.

**Guidelines:**

- MUST hard-gate `must`-priority scenarios at 100%: a `must` row with no asserting flow blocks the run.
- MUST fail the run on structural tag errors — a flow tagging a scenario id that is not in the catalog (what `e2e/check-scenario-coverage.mjs` enforces); a silently mis-joined tag corrupts the metric.
- SHOULD keep `should` / `may` coverage report-only until the `must` gate is stable, then tighten deliberately (in the gate script).
- SHOULD keep the gate fast and device-free so it can run everywhere (it is pure file bookkeeping; `npm run test:e2e:coverage` needs no simulator).
