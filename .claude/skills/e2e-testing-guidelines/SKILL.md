---
name: e2e-testing-guidelines
description: Conventions for Maestro end-to-end tests. Covers the e2e/ flow layout and file naming, flow naming and step labels, stable testID `id:` selectors with relative-selector disambiguation (text matching only when asserting the copy itself), Maestro's auto-waiting assertions and extendedWaitUntil (never fixed sleeps), shared runFlow subflows and clean-state launches, the scenario-coverage journey catalog with scenario tagging and its gate script, and commands for running flows against dev and release builds on a simulator.
when_to_use: Use whenever writing, reviewing, refactoring, or running end-to-end tests, or whenever a change requires verification via the e2e suite — even when the user only mentions e2e tests, snapshots, test IDs, polling/waiting, focus assertions, or a failing test run.
user-invocable: false
---

# E2E Testing Guidelines

Apply these rules when running, writing or reviewing Maestro end-to-end tests in this project.

## End-to-End Test Commands

See [commands.md](./references/commands.md) for:

- Running end-to-end tests

## End-to-End Test Structure

See [structure.md](./references/structure.md) for:

- The `e2e/flows/` layout (feature subdirectories mirroring `src/<feature>/`, smoke flows at the root) and `e2e/helpers/` subflows
- Flow-file naming and flow-config `name:`/`tags:` requirements
- One journey per flow; step `label:` granularity

## End-to-End Test Conventions

See [conventions.md](./references/conventions.md) for:

- The locator fallback hierarchy (`id:` testID selectors first, relative selectors to disambiguate, accessibility labels for uninstrumentable controls, text only for copy assertions)
- Maestro's auto-waiting assertions, `extendedWaitUntil`, and the no-fixed-sleeps rule
- Clean-state launches, shared `runFlow` subflows, and `env` parameters

## E2E Scenario Coverage

See [scenario-coverage.md](./references/scenario-coverage.md) for:

- The scenario-coverage metric (user journeys asserted, **not** e2e line coverage) and why line coverage was rejected
- The journey catalog (`e2e/scenarios.md`) and the `scenario:<id>` join tag in flow configs
- The gate (`e2e/check-scenario-coverage.mjs`): `must`-priority journeys block, `should`/`may` report-only, structural tag errors always fail
