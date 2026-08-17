# Directory Structure

Where a file goes in this repository, what it is called, and which module may import
which.

The general practice — which tier a shared module belongs in, when a module is promoted
out of the feature that owns it, how a route file relates to the screen it mounts —
belongs to the installed `expo-app-development` capability. What follows is this
repository's own paths, tiers, and ratified exceptions, which nothing outside it could
infer.

## The tree

| Path                         | Owns                                                                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/`                   | Expo Router routes — thin entry points only                                                                                                       |
| `src/<feature>/`             | One feature: `components/`, `queries/`, `mutations/`, `models/`, `helpers/`, `hooks/`, `stores/` as needed                                         |
| `src/common/`                | Primitives shared across features: `components/` and `helpers/`                                                                                   |
| `src/core/`                  | App bootstrap and infrastructure: `db/` (the schema, the shared client, and generated migrations) and `helpers/` (env, logging, error reporting, the query client) |
| `src/unistyles.ts`           | Unistyles theme and breakpoints — declared and registered here, imported first by the root layout                                                 |
| `e2e/`                       | Maestro flows (`flows/`), the scenario catalog (`scenarios.md`), and the coverage gate (`check-scenario-coverage.mjs`)                            |
| `assets/`                    | App icons, splash images, and the bundled fonts that `app.json`'s `expo-font` plugin registers — there is no `useFonts` call                       |
| `jest/`                      | Hand-written module mocks that `jest.config.cjs` maps in; each carries the comment explaining why it exists                                        |
| `fastlane/`                  | The Android preview lane (`Fastfile`, `Appfile`, `Pluginfile`) the preview-build workflow drives                                                   |
| `docs/`                      | This documentation                                                                                                                                |
| `.claude/`                   | Agent skills (`skills/`), the high-fidelity design kit (`assets/`), hooks, and harness settings                                                    |
| `.github/workflows/`         | Merge checks, the independent reviewer, and the Android preview build                                                                             |
| `app.json` + `app.config.ts` | Expo app configuration, in two layers — the Repository gotchas in [README.md](../../README.md) state which values the dynamic layer replaces at build time |

## Tiers

A new domain earns a directory: feature code MUST live in `src/<feature>/…`, and the
feature directory is created when that domain's first file lands rather than reserved
ahead of it.

The choice between `src/common/` and `src/core/` MUST be made by the content test in
the installed `expo-app-development` capability's
[project-layout.md](../../.claude/skills/expo-app-development/references/project-layout.md),
not here: `src/common/` for primitives that carry no domain vocabulary and no
application configuration, `src/core/` for app-wide infrastructure and the singletons
the application is wired from — environment access, clients, the error tracker,
storage. Consumer count does not decide it. A module used by three features still
belongs in `src/core/` if it carries domain vocabulary or application configuration,
and one used by three features carrying neither still belongs in `src/common/`.

That capability also owns when a module leaves the feature that owns it, and states it
as a SHOULD rather than a MUST — a module stays with its feature until a second feature
imports it. Its threshold is deliberately looser than the one the installed
`react-component-development` capability sets for a shared *component*, which waits for
a third feature or a second needing it identically. Neither threshold is this
repository's to set, and the two are not interchangeable.

## Import direction

Imports flow one way through the tiers — `src/app/` → `src/<feature>/` →
`src/common/` → `src/core/`. A module MUST NOT import from a tier above it:
`src/common/` and `src/core/` never import a feature. One feature MUST NOT import
another; a module two features need moves to whichever tier the content test above puts
it in.

Three exceptions are ratified, and none of them generalises — a new upward or
cross-feature import is a violation, not a precedent.

`src/core/helpers/query-client.ts` MAY import `PayloadRequestError` from
`src/common/helpers/payload-client.ts` and `describeQueryKey` from
`src/common/helpers/session-query-key.ts`, so that a failed query can be classified and
described before it is reported. Both modules stay in `src/common/`. The content test
above has two halves, and this exception argues one: neither encodes this application's
configuration, and neither is one of the singletons the app is wired from. The other —
whether either carries domain vocabulary — is left open here rather than asserted.
[agent-skills.md](./agent-skills.md) records what the Payload client's placement rests
on and names that half as the one where a reviewer could reasonably differ, and
`session-query-key.ts` returns the literal `"users"`, so the same question is open for
the describer too. The describer belongs beside the session-root factory it redacts
against either way, since it is only correct while the two agree. The crossing is
therefore permitted rather than a debt to be paid off.

`src/collections/` and `src/settings/` MAY import `src/auth/`'s session surface —
`stores/auth-store`, `models/session`, and `mutations/sign-out-mutation` — because that
surface is the app's session state rather than one feature's private state. Everything
else inside a feature, `src/auth/` included, stays private to it.

A **test file** MAY import a route module from `src/app/` when `renderRouter` needs it
in a route map; `src/collections/components/collections-screen/collections-screen.test.tsx`
is the only instance. The exception is scoped to test files and to that use. The
installed `expo-app-development` capability requires the router's own route-rendering
helper for behaviour that depends on the route tree, and that helper is given the route
modules it should mount — so the import is a prescribed testing pattern rather than a
layering violation.

## Naming, aliases, and colocated tests

File names MUST be kebab-case throughout — `button-icon.tsx`, `collections-screen.tsx`
— matching the [axross/porousel](https://github.com/axross/porousel) convention this
codebase follows.

A cross-directory import MUST go through a path alias rather than a counted run of
`../` segments: `~/*` resolves to `src/*` and `~/assets/*` to `assets/*`, both declared
in `tsconfig.json` and mirrored in `jest.config.cjs`. A relative path is for imports
within the same directory subtree only, where the alias would say less than the
relative path does.

A unit test MUST sit beside its subject as `<name>.test.ts(x)`; `jest.config.cjs`
matches tests under `src/` only, so a test written anywhere else never runs.
