# E2E Test Commands

Use this reference to choose the Maestro command that matches the target environment. Maestro drives a real build of the app, so a simulator/emulator (or device) with the app installed must be running first.

## Running E2E Tests

Run:

```bash
npm run test:e2e
```

This first runs the scenario-coverage gate (`e2e/check-scenario-coverage.mjs`), then `maestro test e2e/flows` against the running app.

**Guidelines:**

- MUST use `npm run test:e2e` for the default local end-to-end verification run.
- MUST have the app installed and running on a simulator/emulator first (`npm run ios` or `npm run android`).
- MUST run `npm run test:e2e:coverage` (the gate alone, no device needed) when no simulator is available, and report that the on-device run was skipped.

## Running a Subset

Run a single flow or a tagged subset while iterating:

```bash
npx maestro test e2e/flows/app-launch.yaml
npx maestro test --include-tags "scenario:app-launch" e2e/flows
```

**Guidelines:**

- SHOULD iterate on one flow with a direct file argument, then finish with the full `npm run test:e2e` run.

## Test Against a Release-Shaped Build

Maestro exercises whatever build is installed. To verify production-only behavior, install a release build first:

```bash
npx expo run:ios --configuration Release   # or: npx expo run:android --variant release
npm run test:e2e
```

**Guidelines:**

- SHOULD use a release-configuration build when verifying behavior that differs from the dev client (startup, error reporting, performance).
