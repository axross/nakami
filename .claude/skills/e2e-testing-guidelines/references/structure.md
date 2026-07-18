# E2E Test Structure

## Project Structure

Tests are easiest to find when their location mirrors the surface they cover. Maestro flows live under `e2e/flows/`, shared subflows under `e2e/helpers/`, and the journey catalog at the root of `e2e/`.

```
<root>
├── e2e/
│   ├── scenarios.md                   # journey catalog (scenario coverage)
│   ├── check-scenario-coverage.mjs    # coverage gate script
│   ├── helpers/                       # shared subflows invoked via runFlow
│   └── flows/
│       ├── app-launch.yaml            # smoke: cold start reaches home
│       └── <feature>/                 # feature-specific flows
│           └── <journey>.yaml
└── ...
```

**Guidelines:**

- MUST place feature-specific flows under `e2e/flows/<feature>/`, mirroring the `src/<feature>/` domain the flow covers; cross-feature journeys (smoke, app-launch) sit directly under `e2e/flows/`.
- MUST keep reusable subflows under `e2e/helpers/` and invoke them with `runFlow` — helpers there are not picked up as top-level tests.
- MUST treat `app-launch.yaml` as the smoke gate: if it fails, deeper flows are not worth running.
- SHOULD guard each previously shipped bug with a named regression flow instead of folding the check into an unrelated flow.

## Flow File Structure

File names are kebab-case `.yaml` files named after the journey they assert, so the flow list reads as a journey list.

**Guidelines:**

- MUST use kebab-case for flow file names, named after the journey (`feed-create.yaml`), not the screen.
- MUST set a human-readable `name:` in the flow config describing the journey outcome.
- MUST declare the flow's `tags:` (scenario join tags, optional facets) in the flow config.

## Flow Step Structure

One journey per flow keeps failures diagnosable, and labeled steps turn a multi-phase journey's log into a readable narrative.

**Guidelines:**

- MUST assert one journey per flow; split independent outcomes into separate flows.
- SHOULD add a `label:` to steps whose intent is not obvious from the command itself, at human-understandable granularity.
- MUST NOT pad a short atomic flow with labels that restate the command.
