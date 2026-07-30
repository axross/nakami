# Repository Map

Apply this reference when placing or naming a new file, deciding which directory a module belongs in, or judging whether one module may import another.

## Top-Level Layout

Every directory an agent will touch, and what it owns:

| Path                         | Owns                                                                                                                                                                                                                                    |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/`                   | Expo Router routes — thin entry points only                                                                                                                                                                                             |
| `src/<feature>/`             | One domain feature: `components/`, `queries/`, `mutations/`, `models/`, `helpers/`, `hooks/`, `stores/` as needed                                                                                                                       |
| `src/common/`                | Code shared by ≥ 2 features: `components/`, `constants/`, `helpers/`                                                                                                                                                                    |
| `src/core/`                  | App bootstrap and infrastructure: `db/` (`schema.ts`, `client.ts`, and `migrations/` once one is generated), `helpers/` (env, logging, error-reporting, query-client)                                                                    |
| `src/unistyles.ts`           | Unistyles theme/breakpoint registration (imported first by the root layout)                                                                                                                                                             |
| `e2e/`                       | Maestro flows (`flows/`), the scenario catalog (`scenarios.md`), and the coverage gate (`check-scenario-coverage.mjs`)                                                                                                                  |
| `assets/`                    | App icons, splash, bundled fonts (registered through `app.json`'s `expo-font` plugin — there is no `useFonts` call), and other bundled binary assets                                                                                     |
| `jest/`                      | Hand-written module mocks that `jest.config.cjs` maps in (`reanimated-mock.js`, `lucide-react-native-mock.js`); each carries the comment explaining why it exists                                                                        |
| `fastlane/`                  | The Android preview lane (`Fastfile`, `Appfile`, `Pluginfile`) the preview-build workflow drives                                                                                                                                        |
| `.claude/`                   | Agent skills (`skills/`), the high-fidelity design kit (`assets/hifi-design-kit.html`), hooks, and harness settings                                                                                                                     |
| `.github/workflows/`         | Merge checks CI, the independent Claude reviewer, and the Android preview build                                                                                                                                                        |
| `app.json` + `app.config.ts` | Expo app configuration in **two** layers: `app.json` is the static config, and `app.config.ts` receives it at build time, overriding `version` (from `PREVIEW_VERSION_NAME`, which the Android preview build sets) and injecting `extra.commitHash` |

## Placement

A module's directory is decided by how many features consume it, not by what it does. A helper used by one feature stays inside that feature however general it looks; the move to `src/common/` is earned by a second consumer, not anticipated.

**Guidelines:**

- MUST place feature code in `src/<feature>/…`; create the feature directory when the first file of a new domain lands.
- MUST place a module used by two or more features in `src/common/`, and keep single-consumer modules feature-local.
- MUST keep `src/core/` free of feature logic — only cross-cutting infrastructure lives there.

## Import Direction

Imports flow one way through the layers — `src/app/` → `src/<feature>/` → `src/common/` → `src/core/` — and features never reach sideways into each other. Both rules carry one ratified exception apiece, and neither exception generalizes: a new upward or cross-feature import is a violation, not a precedent.

**Guidelines:**

- MUST keep imports flowing one way through the layers, and MUST NOT import from a layer above: `src/common/` and `src/core/` never import a feature. The one ratified exception is `src/core/helpers/query-client.ts` importing `PayloadRequestError` from `src/common/helpers/payload-client.ts`; relocating that client to remove the exception is tracked as issue #89.
- MUST NOT import one feature from another, and MUST move a module two features need into `src/common/` instead. `src/auth/` is the ratified exception: its **session surface** — `stores/auth-store`, `models/session`, and `mutations/sign-out-mutation` — is the app's session state, which `src/collections/` and `src/settings/` already consume. Everything else inside a feature, `src/auth/` included, stays private to it.

## Naming, Aliases, and Colocation

File names are kebab-case throughout, matching the [axross/porousel](https://github.com/axross/porousel) convention this codebase follows — `button-icon.tsx`, `feed-create-form.tsx`. Cross-directory imports go through the path aliases rather than counting `../` segments.

**Guidelines:**

- MUST name files kebab-case.
- MUST use the `~/*` alias (→ `src/*`) for cross-directory imports, and `~/assets/*` (→ `assets/*`) for bundled assets; both are declared in `tsconfig.json` and mirrored in `jest.config.cjs`. Relative paths only within the same directory subtree.
- MUST colocate unit tests with their subject as `<name>.test.ts(x)`.

## App Configuration Layers

Expo app configuration is resolved from two files, not one. `app.json` is the static config; `app.config.ts` receives it at build time and overrides `version` from `PREVIEW_VERSION_NAME` while injecting `extra.commitHash`. A change made in only the static layer can therefore be silently replaced before it ships.

**Guidelines:**

- MUST consider **both** app-config layers when changing app configuration: a `version` or `extra` value set only in `app.json` is replaced at build time by `app.config.ts`, and `expo prebuild` bakes the resolved value into the native project.
