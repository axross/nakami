# Dev Commands

Apply this reference when choosing which project command to run or when updating the command surface in the project's manifest. The project pins its runtime version (Node 22) in the CI workflows; respect that pin when running or upgrading.

## Application Commands

These commands run the application locally or produce a release-shaped bundle.

| Command | Purpose |
| ------- | ------- |
| `npm run dev` | Starts the Expo dev server (connect with a dev build or simulator). |
| `npm run ios` / `npm run android` | Compiles and runs the native dev build on a simulator/emulator or device. |
| `npm run build` | Exports the production JS bundles for iOS and Android (`expo export`). Signed, installable Android APKs are produced by the Fastlane preview workflow (`android-build.yml`). |

**Guidelines:**

- MUST use `npm run dev` (with a dev build or simulator) for manual verification of UI, routing, and data-driven output changes.
- MUST run `npm run build` after changes affect routes, app config (`app.json`), Babel/Metro config, dependencies, or public type signatures — it catches bundler and config-plugin breakage without a native build.
- SHOULD use `npm run ios` / `npm run android` when a change touches native modules or config plugins, since `expo export` does not exercise native code.

## Quality Commands

These commands enforce formatting, linting, and end-to-end behavior.

| Command | Purpose |
| ------- | ------- |
| `npm run format` | Formats the code and documentation with Biome. |
| `npm run lint` | Runs Biome, including formatting and lint rules. |
| `npm run typecheck` | Type-checks the project with the TypeScript compiler. |
| `npm run test:unit` | Runs the Jest (jest-expo) unit suite. |
| `npm run test:e2e` | Checks scenario coverage, then runs the Maestro end-to-end suite (requires a running simulator/emulator with the app installed). |
| `npm run test:e2e:coverage` | Runs only the scenario-coverage gate (no device needed). |

**Guidelines:**

- MUST run `npm run format` and `npm run lint` after code or documentation edits.
- MUST run `npm run test:unit` after a change affects code it covers.
- MUST run `npm run test:e2e` after a change affects a UI output surface or e2e coverage, and report when no device/simulator is available to run it (run `npm run test:e2e:coverage` at minimum).
- SHOULD report skipped quality commands, including the reason and residual risk, before completion.

## Data-Layer Commands

Data-layer commands manage the Drizzle schema and its generated migrations. Migrations are generated at development time and are meant to be applied on-device at app startup via Drizzle's expo-sqlite migrator (`useMigrations`) — that migrator is **not wired yet**: the change that lands the first migration MUST also wire `useMigrations` into the root layout (`src/app/_layout.tsx`), or the migration will never run.

| Command | Purpose |
| ------- | ------- |
| `npm run db-migrate:generate` | Generates a SQL migration under `src/core/db/migrations/` from changes to `src/core/db/schema.ts`. |

**Guidelines:**

- MUST run `npm run db-migrate:generate` immediately after changing the data-layer schema, and commit the generated migration with the schema change.
- MUST NOT edit an already-committed migration file; change the schema and generate a new migration instead.
- MUST NOT hand-edit files under `src/core/db/migrations/` — they are generated.
