---
name: project-structure
description: The repository map for payload-mobile — stack facts (Expo SDK, TypeScript, npm, Biome, Zustand + TanStack Query, Drizzle over expo-sqlite, Zod, Unistyles, Jest, Maestro), the by-feature directory layout under src/, the ~/ path alias, and where every kind of new file goes.
when_to_use: Use when navigating the repository, deciding where a new module, route, component, query, or test belongs, or checking stack, tooling, and directory conventions.
user-invocable: false
---

# Project Structure

payload-mobile is a companion mobile app for Payload CMS, built with Expo (React Native) for iOS and Android. This skill owns _where files live_; how components are built belongs to Component Guidelines, and route-file conventions belong to Routing Guidelines (both resolved via the `AGENTS.md` skill index).

## Stack

- Runtime/framework: Expo SDK 57 (React Native 0.86, React 19) with Expo Router file-based routing; New Architecture and the React Compiler are enabled.
- Language: TypeScript (strict), checked with `npx tsc` via `npm run typecheck`.
- Package manager: npm; runtime version (Node 22) pinned in the CI workflows and `eas.json`.
- Lint/format: Biome (`biome.json`), tabs + double quotes.
- Directory convention: **by feature** — one directory per domain under `src/`, each owning its own components, queries, mutations, models, and helpers.
- Business logic: React hooks; client state in Zustand stores, server/db cache in TanStack Query (`queryClient` in `src/core/helpers/query-client.ts`).
- Data: Drizzle ORM over expo-sqlite; schema in `src/core/db/schema.ts`, shared client in `src/core/db/client.ts`, generated migrations in `src/core/db/migrations/`.
- Validation: Zod for all external input (env, deep-link params, API payloads, db-row parsing).
- Styling/theming: react-native-unistyles; themes/breakpoints defined in `src/common/constants/style.ts`, configured in `src/unistyles.ts`.
- Tests: Jest (jest-expo) unit tests colocated with their subject; Maestro e2e flows in `e2e/flows/`.
- Import aliases: `~/*` → `src/*` and `~/assets/*` → `assets/*` (declared in `tsconfig.json`; Jest mirrors both in `jest.config.cjs`).

## Top-Level Layout

| Path                 | Owns                                                                                                                           |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `src/app/`           | Expo Router routes — thin entry points only (see Routing Guidelines)                                                           |
| `src/<feature>/`     | One domain feature: `components/`, `queries/`, `mutations/`, `models/`, `helpers/`, `assets/` as needed                        |
| `src/common/`        | Code shared by ≥ 2 features: `components/`, `constants/`, `helpers/`                                                           |
| `src/core/`          | App bootstrap and infrastructure: `db/` (schema, client, migrations), `helpers/` (env, logging, error-reporting, query-client) |
| `src/unistyles.ts`   | Unistyles theme/breakpoint registration (imported first by the root layout)                                                    |
| `e2e/`               | Maestro flows (`flows/`), shared subflows (`helpers/`), scenario catalog (`scenarios.md`), coverage gate script                |
| `assets/`            | App icons, splash, and other bundled binary assets                                                                             |
| `.claude/`           | Agent skills, hooks, harness settings, and the `workflows/` Workflow-tool scripts the Address skill launches for its Phase 2 checks |
| `.github/workflows/` | Merge checks CI and the independent Claude reviewer                                                                            |

## File Placement

- MUST place feature code in `src/<feature>/…`; create the feature directory when the first file of a new domain lands.
- MUST place a module used by two or more features in `src/common/` (components/constants/helpers by kind), and keep single-consumer modules feature-local.
- MUST keep `src/core/` free of feature logic — only cross-cutting infrastructure (db, env, logging, error reporting, query client) lives there.
- MUST colocate unit tests with their subject as `<name>.test.ts(x)`.
- MUST add new tables to `src/core/db/schema.ts` and commit the generated migration from `npm run db-migrate:generate` alongside; feature-level data access (queries/mutations wrapping the shared `db` client) stays in the owning feature.
- MUST use the `~/` alias for cross-directory imports; relative paths only within the same directory subtree (max two levels).
- SHOULD name files kebab-case, matching the porousel convention (`button-icon.tsx`, `feed-create-form.tsx`).
- MUST consult the Address skill before changing scripts under `.claude/workflows/` — they implement its Phase 2 self-check and acceptance-criteria delegation contract — and Agent Skills Best Practices (both via the `AGENTS.md` skill index) for the delegation pattern's rules.
