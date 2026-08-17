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
| `src/common/test-helpers/`   | Modules that exist for the unit suite alone — a spec file may import one, application code never does                                              |
| `src/core/`                  | App bootstrap and infrastructure: `db/` (the schema, the shared client, and generated migrations) and `helpers/` (env, logging, error reporting, the query client) |
| `src/unistyles.ts`           | Unistyles theme and breakpoints — declared and registered here, imported first by the root layout                                                 |
| `e2e/`                       | Maestro flows (`flows/`), the scenario catalog (`scenarios.md`), and the coverage gate in two parts — the runner-agnostic core (`scenario-coverage.mjs`) and the Maestro adapter that runs it (`check-scenario-coverage.mjs`); [end-to-end-testing.md](./end-to-end-testing.md) states what each holds |
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

`src/core/helpers/query-client.ts` and its colocated test MAY import
`PayloadRequestError` from `src/common/helpers/payload-client.ts`, and the query-key
root and describer from `src/common/helpers/session-query-key.ts`, so that a failed
query can be classified and described before it is reported. Both modules stay in
`src/common/`. The content test above puts `session-query-key.ts` there on both halves:
it encodes no configuration of this application and is not one of the singletons the app
is wired from, and it carries no domain vocabulary either — neither signature names a
domain type, and the `"users"` literal is a fixed query-key namespace rather than a
Collection slug, since the auth collection's own slug varies per session and arrives at
sign-in. [agent-skills.md](./agent-skills.md) records what the Payload client's own
placement rests on. The crossing is therefore permitted rather than a debt to be paid
off.

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

## Test-only modules

A module the unit suite alone uses — a helper that reads what a render produced, a
factory that builds a throwaway client — MUST live in `src/common/test-helpers/`, and
nothing that is not test-only belongs there. It holds `resolve-style.ts`, which flattens
a rendered `style` prop into the single object the renderer would apply, and
`query-client.ts`, which builds the per-test `QueryClient`
[server-state.md](./server-state.md) requires.

The directory sits beside `src/common/helpers/` rather than inside it so that
`src/common/helpers/` stays uniformly application code, and "is this module test-only?"
is answered by the import path rather than by opening the file. It stays under `src/`
because the `~/*` alias resolves there, so a spec reaches it the way the rule above
requires every cross-directory import to travel.

Names follow the kebab-case rule above and say what the module provides, with no `test-`
prefix — the directory already carries that signal, and repeating it in the filename
says nothing the import path does not. A filename MUST NOT match `*.test.ts(x)`:
`jest.config.cjs` matches every such file under `src/` as a suite, so a helper named
that way would be collected as a suite of its own and fail the run for holding no tests.

Only a test file MAY import from this directory, and it MAY do so from any tier; an
application module MUST NOT, whichever tier it sits in. In the other direction the
directory travels the same way as the rest of `src/common/`: it MAY import `src/common/`
and `src/core/`, and MUST NOT import a feature.

That import rule is also the whole of what keeps these modules off a device. Metro
bundles what is reachable from the app entry point, and nothing reachable imports
`src/common/test-helpers/`, so no module in it reaches the bundles `npm run build`
emits. No lint rule fences the directory — one was considered and deliberately declined
— so the boundary rests on this convention and on review. An application import would
fail no check; it would quietly put a test-only module into a shipped bundle.
