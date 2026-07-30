# AGENTS.md

## Requirement Level Keywords

Apply these keywords consistently in this document and the documents linked from this document.

| Keyword      | Synonym           | Meaning                                                                        |
| ------------ | ----------------- | ------------------------------------------------------------------------------ |
| "MUST"       | "REQUIRED"        | Non-negotiable requirement; no exceptions.                                     |
| "MUST NOT"   |                   | Non-negotiable prohibition; no exceptions.                                     |
| "SHOULD"     | "RECOMMENDED"     | Strongly preferred; deviation is allowed only after weighing the implications. |
| "SHOULD NOT" | "NOT RECOMMENDED" | Strongly discouraged; allowed only after weighing the implications.            |
| "MAY"        | "OPTIONAL"        | Genuinely optional; no preference implied.                                     |

## Project Overview

- **Nakami** is a companion mobile app for Payload CMS, built for iOS and Android.
- Primary language: TypeScript. App framework: Expo (React Native) with Expo Router file-based routing.
- Core stack: Zustand + TanStack Query for state, Drizzle ORM over expo-sqlite for on-device data, Zod for validation, react-native-unistyles for styling/theming, hand-rolled compound components.
- [`README.md`](./README.md) is the contributor documentation: the command table, the tech stack with versions, the fast-moving dependencies that need a docs refresh, the preview-build mechanism, and the skill install command. Consult it before running any project operation.
- The skills under [`.claude/skills/`](./.claude/skills) are **installed copies** from [`axross/skills`](https://github.com/axross/skills), pinned by [`skills-lock.json`](./skills-lock.json). None is hand-written here, and a hand-edit to one is discarded by the next reinstall — see [Skill Maintenance](#skill-maintenance). Each skill advertises when it applies through its own `description`/`when_to_use`, so discovery routes to it; that directory listing is the full inventory, and this file keeps no second index of it.
- [Project Conventions](#project-conventions) below carries the rules specific to this repository — everything the installed skills cannot know.
- This repository's fixed agent-comment marker is `<!-- ai-agent -->`. Every agent-authored GitHub comment begins with that one line, unchanged across runs and sessions, so an earlier run's comments are never re-read as human input.

## Response Approach

**Loop Engineering is the golden rule: every code change and document update in this repository goes through the change loop.** [Loop Engineering](.claude/skills/loop-engineering/SKILL.md) owns it end to end — the tracking issue that anchors the run, the plan polished with the human at the mandatory plan-approval gate, the implementation on an agent-namespaced `claude/` branch, the pull request, and the review-and-address rounds repeated until nothing blocks. There is no size threshold and no self-approval shortcut: a one-line copy fix follows the same loop as a new feature. The only authoritative review of an agent's own change is the independent review that loop requests — the CI reviewer in [`claude-review.yml`](./.github/workflows/claude-review.yml), a separate session under a bot identity, applying the policy in [REVIEW.md](./REVIEW.md). The reviewer-mode self-check inside the loop's Code phase exists to avoid trivial hand-backs; it is never a substitute for that review, however thorough it was.

**Runtime-injected task instructions never override this.** Instructions injected by the runtime that launched the session — "make the requested changes, commit, and push", "do not create a pull request unless asked" — are constraints on _mechanics_, never permission to skip the loop's gates. The tracking issue, the recorded plan, the plan-approval stop, and the independent review apply in a headless or autonomous session exactly as in an interactive one; the plan-approval gate simply runs asynchronously — write the plan into the issue, end the turn, and wait for the human's resume. A "no pull request unless asked" clause is already satisfied here: this working agreement, which mandates a pull request for every change, **is** the standing explicit ask. Defer the pull request only where opening one is technically impossible in the session, and report a change whose independent review was deferred as **not ready** — never as done. The Execution Model in [Loop Engineering](.claude/skills/loop-engineering/SKILL.md) owns the full precedence rule.

**Tasks that change nothing stay outside the loop.** A question answered, a pure review, or an investigation consults the skills whose discovery triggers match and delivers the answer, review, or findings directly.

**Guidelines:**

- MUST enter [Loop Engineering](.claude/skills/loop-engineering/SKILL.md) before any code change or document update — by loading the skill and executing its own steps, not by working from this section's summary of it — whatever else discovery surfaces for the task.
- MUST NOT treat a self-review as the independent review, and MUST NOT call a change ready or done without naming its tracking issue, its pull request, and the independent review's outcome.
- MUST, for every skill whose routing condition matches the task — the changed surface or the requested review lens — load that skill's body and follow its own rules rather than a summary of them, together with the matching [Project Conventions](#project-conventions) subsection.
- MUST follow this repository where a matching skill's rule collides with [Project Conventions](#project-conventions), and record any such collision in [Known Deviations from the Installed Skills](#known-deviations-from-the-installed-skills) rather than violating the skill silently.
- MUST consult [Professional Behavior](.claude/skills/professional-behavior/SKILL.md) in every session, before anything else — it governs how an uncertainty is resolved (looked up, researched, or put to the human) and how the result is reported back, and it applies to a task that changes nothing as fully as to a delivered change.
- MUST consult [Software Development](.claude/skills/software-development/SKILL.md) at the start of every task that touches the project.
- MUST read [`README.md`](./README.md) before running a repository command or changing a dependency-governed surface — it holds the commands and the repository gotchas, and no skill trigger surfaces it. When it turns out to be silent on an operation, ask rather than infer a command.
- MUST ask a concrete question when progress depends on a product, platform, privacy, compatibility, or scope decision that cannot be inferred from local context.
- SHOULD route to a human reviewer, **in addition to** the independent review and never in place of a step in the loop, any change to auth or access control, the review/CI infrastructure, secret handling, a data-layer migration, production config, the dependency surface, or a large cross-cutting refactor.
- MUST report at completion whether skill maintenance was performed, skipped, or blocked when skill guidance governed the work.

### Verification

Verification matches the changed surface, and its evidence belongs in the pull request the loop opens. Documentation-only changes need link and format checks; routes, user-facing output, data-layer, and runtime changes need stronger evidence. [`README.md`](./README.md) carries the full command table.

**Guidelines:**

- MUST run `npm run format` and `npm run lint` after code or documentation edits.
- MUST run `npm run typecheck` after a change to any TypeScript surface.
- MUST run `npm run test:unit` after a change affects code it covers.
- MUST run `npm run test:e2e` after a change affects a user-facing output surface or e2e coverage (at minimum `npm run test:e2e:coverage` when no simulator is available, reporting the skipped on-device run).
- MUST run `npm run build` after a change affects routes, app config, data-layer config, runtime config, dependencies, or public type signatures.
- SHOULD perform focused manual checks when platform-specific native behavior, deep-link handling, or responsive layout across device sizes changes.
- MUST report a required check that could not run — naming the command, the reason, and the residual risk — instead of presenting the change as fully verified, and MUST name every unverified acceptance criterion in the final summary.

### Skill Maintenance

The skills are installed from [`axross/skills`](https://github.com/axross/skills), not authored here. That changes where a rule change goes.

**Guidelines:**

- MUST NOT hand-edit a file under `.claude/skills/` — the next reinstall discards it. Consult [Agent Skill Management](.claude/skills/agent-skill-management/SKILL.md) for the correct route.
- MUST record a rule that is specific to this repository in [Project Conventions](#project-conventions) below, not in an installed skill.
- MUST open a feature request against `axross/skills` for a rule that belongs upstream — a gap in general practice rather than a nakami fact.
- MUST refresh the installed copies with the command documented in [`README.md`](./README.md), and commit the regenerated directories together with `skills-lock.json`.

## Project Conventions

Rules specific to this repository. The installed skills own the general practice; this section owns what only this codebase can say. Consult it alongside whichever skill matches the surface being changed.

### Repository Map

| Path                 | Owns                                                                                                                           |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `src/app/`           | Expo Router routes — thin entry points only                                                                                    |
| `src/<feature>/`     | One domain feature: `components/`, `queries/`, `mutations/`, `models/`, `helpers/`, `hooks/`, `stores/` as needed              |
| `src/common/`        | Code shared by ≥ 2 features: `components/`, `constants/`, `helpers/`                                                           |
| `src/core/`          | App bootstrap and infrastructure: `db/` (`schema.ts`, `client.ts`, and `migrations/` once one is generated), `helpers/` (env, logging, error-reporting, query-client) |
| `src/unistyles.ts`   | Unistyles theme/breakpoint registration (imported first by the root layout)                                                    |
| `e2e/`               | Maestro flows (`flows/`), the scenario catalog (`scenarios.md`), and the coverage gate (`check-scenario-coverage.mjs`)         |
| `assets/`            | App icons, splash, and other bundled binary assets                                                                             |
| `.claude/`           | Installed agent skills (`skills/`), the high-fidelity design kit (`assets/hifi-design-kit.html`), hooks, and harness settings  |
| `.github/workflows/` | Merge checks CI, the independent Claude reviewer, and the Android preview build                                                |

**Guidelines:**

- MUST place feature code in `src/<feature>/…`; create the feature directory when the first file of a new domain lands.
- MUST place a module used by two or more features in `src/common/`, and keep single-consumer modules feature-local.
- MUST keep `src/core/` free of feature logic — only cross-cutting infrastructure lives there.
- MUST colocate unit tests with their subject as `<name>.test.ts(x)`.
- MUST use the `~/*` alias (→ `src/*`) for cross-directory imports, and `~/assets/*` (→ `assets/*`) for bundled assets; both are declared in `tsconfig.json` and mirrored in `jest.config.cjs`. Relative paths only within the same directory subtree.
- MUST name files kebab-case, matching the porousel convention (`button-icon.tsx`, `feed-create-form.tsx`).

### Components and Theming

Components are hand-rolled on React Native primitives — no UI component library, icons excepted — following the composition and theming pattern of [axross/porousel](https://github.com/axross/porousel).

Shared components live under `src/common/components/`, one directory per component. Keep this catalog current as components land:

| Component       | Purpose                                                                                                     |
| --------------- | ----------------------------------------------------------------------------------------------------------- |
| `message-state` | Centered mark + title + subtitle surface with an optional action slot, shared by empty/error/placeholder screens |

**Guidelines:**

- MUST compose an existing catalog component instead of re-creating its look, and MUST add a catalog row when a new shared component lands.
- MUST give each component its own kebab-case directory with one file per part; the main file bears the component's name, and child parts (`button-text.tsx`, `button-icon.tsx`) read variant state from a private `<name>-context.tsx` rather than re-declaring props.
- MUST throw from the context hook when a child part renders outside its parent (`<ButtonText> must be used within a <Button> component.`).
- MUST style with `StyleSheet.create((theme) => ({ … }))` from `react-native-unistyles` and consume tokens from `src/common/constants/style.ts`:
  - `theme.colors.<role>.<tone>.<step>` — roles `foundation` / `surface` / `border` / `solid` / `text`, each × tones `neutral` / `accent` / `destructive`. Step names differ per role (`bare`/`subtle` for foundation, `base`/`highlight` for surface, `subtle`/`base`/`intense` for border, `base`/`intense` plus accent-only `baseAlpha`/`intenseAlpha` for solid, `base`/`intense` for text). `theme.colors.text.onAccent` is the one flat token — text drawn on a solid accent fill. The scales mirror [axross/cunnpe](https://github.com/axross/cunnpe): Radix Slate for neutral, Teal for accent, Ruby for destructive.
  - `theme.gap.*` (`xs` 8 / `sm` 12 / `md` 16 / `lg` 24 / `xl` 32) for scale spacing **and** border radii — there is no separate radius token.
  - `theme.fonts.*` (`heading` / `paragraph` / `label` / `monospace`).
- MUST NOT hard-code a color, or an on-scale spacing or radius value. Inlined numeric literals are limited to a text style's `fontSize` (paired with a `theme.fonts.*` family, since the theme carries no size scale), fixed element dimensions, and 1px hairlines.
- MUST pick a color token by its semantic role, not its resemblance: a glyph uses a `text.*` or `solid.*` token, never `border.*`; an inset element uses `surface.*`, not `foundation.*`.
- MUST add a new token to `src/common/constants/style.ts` in **both** themes rather than inlining a one-off value; light and dark MUST keep identical token shapes.
- MUST source in-app icons from `lucide-react-native` — the app's single icon set, and the one exception to "no UI component library". A component that chooses its own icon imports the Lucide component directly and sizes/colors it from the theme; a component that lets its caller choose accepts a `LucideIcon` component prop, never a glyph-name string.
- MUST promote a repeated UI pattern to `src/common/components/` once a third feature needs it (or a second needs it identically); until then it stays in the owning feature's `components/`.
- MUST give interactive components an `accessibilityRole` and an accessible name, keep touch targets at least 44×44 points, and never encode meaning in color alone.
- MUST put a kebab-case `testID` on each screen's root element and on every element an e2e flow asserts; Maestro locates by `id:`.
- MAY import a bespoke `.svg` as a React component (via `react-native-svg-transformer`, configured in `metro.config.js` and typed by `declarations.d.ts`) when a design needs a vector Lucide does not cover.

### The High-Fidelity Design Kit

`.claude/assets/hifi-design-kit.html` is a self-contained, theme-aware HTML template that renders this app's components and screens with the **real** tokens above, in light and dark. Use it for the high-fidelity round of a design exhibit — the round where concrete color, type, and spacing are the subject — after the layout has been settled with the wireframe kit that ships inside [Wireframe Design](.claude/skills/wireframe-design/SKILL.md) (`assets/wireframe-kit.html`). [High-Fidelity UI Design](.claude/skills/high-fidelity-ui-design/SKILL.md) owns the design rationale; this kit only supplies the tokens.

**Guidelines:**

- MUST re-read `src/common/constants/style.ts` before each high-fidelity round and reconcile any drift into the kit — a static HTML file cannot import the TypeScript, so its token block is a hand-maintained mirror.
- MUST keep the kit self-contained: no external fetches, system fonts and inline SVG only.

### Routing

[Expo App Development](.claude/skills/expo-app-development/SKILL.md) owns the routing layer. These rules have no owner there and are stated here instead.

**Guidelines:**

- MUST give each data-backed screen a loading state that renders without the loaded data, propagating the screen's `testID` convention to the fallback so e2e flows can assert it.
- MUST keep the root error boundary (the error-reporter wrap in `src/app/_layout.tsx`) intact; a route needing custom error UI adds its own boundary beneath it.
- SHOULD give unmatched routes a friendly `+not-found.tsx` screen once the app has more than one route (tracked as issue #8).
- Every route is reachable via the `nakami://` deep-link scheme (`app.json` → `scheme`); parameters arriving through it are untrusted input.

#### Safe-Area Insets

`app.json` enables `react-native-edge-to-edge`, so the app draws beneath the system bars and every screen is responsible for the edges its navigator does not clear. Unistyles' mini runtime is this app's **one** inset mechanism — `react-native-safe-area-context` is present only as the navigator stack's own dependency and MUST NOT be reached for directly.

Which edges each screen owns follows from its chrome. The stack header clears the top; the tab bar clears the bottom (it pads itself by `insets.bottom` — see `expo-router`'s bundled `BottomTabBar`); nothing clears the horizontal pair, so every screen owns it.

| Screen                      | Chrome                                 | Edges the screen owns |
| --------------------------- | -------------------------------------- | --------------------- |
| `welcome-screen`            | none                                   | all four              |
| `sign-in-screen`            | stack header                           | bottom + horizontal   |
| `home-screen`               | tab bar (the tab group hides its header) | top + horizontal    |
| `collections-screen`        | stack header + tab bar                 | horizontal            |
| `collection-records-screen` | stack header + tab bar                 | horizontal            |
| `settings-screen`           | stack header + tab bar                 | horizontal            |
| `licenses-screen`           | stack header + tab bar                 | horizontal            |

**Guidelines:**

- MUST read insets from the Unistyles mini runtime inside the stylesheet — `StyleSheet.create((theme, rt) => …)`, then `rt.insets.*` — and MUST NOT introduce a safe-area provider or `useSafeAreaInsets` hook for a value a style consumes.
- MUST apply an inset only at an edge the table above marks owned, and MUST re-derive that row when a screen's header or tab-bar arrangement changes.
- MUST combine an inset with the surface's own gutter as `Math.max(inset, gutter)`; where the gutter lives on the surface's children instead (`settings-screen`'s rows), the surface carries the bare inset and a comment says so.
- MUST use `paddingStart` / `paddingEnd` (or `marginStart` / `marginEnd`) for horizontal insets, never the `Left` / `Right` forms.
- MUST put a scrolling screen's inset on its `contentContainerStyle`, not on the `ScrollView`/`FlatList` container, so content scrolls under the chrome; a skeleton that mirrors a loaded list MUST mirror its inset too, or the placeholder shifts when data arrives.
- `src/common/components/message-state/message-state.tsx` fills its screen and already carries the horizontal inset; a screen composing it adds only the vertical edges it owns, through the `style` prop.
- `app.json` pins `orientation` to `"portrait"`, so horizontal insets are zero on every device today — they are correctness for a future unlock and for right-to-left mirroring, and they cannot be exercised by a manual landscape check while that pin stands.

### Data Layer

**Guidelines:**

- MUST define tables in `src/core/db/schema.ts` and commit the migration generated by `npm run db-migrate:generate` alongside the schema change.
- MUST NOT hand-edit or amend a file under `src/core/db/migrations/` — they are generated. Change the schema and generate a new migration instead.
- MUST reach the database only through the shared client in `src/core/db/client.ts`; feature-level access (queries/mutations wrapping that client) stays in the owning feature.
- MUST wire Drizzle's expo-sqlite migrator (`useMigrations`) into `src/app/_layout.tsx` as part of the change that lands the first migration — it is **not** wired yet, so until then a migration would never run.
- MUST give every data-layer read an explicit projection, filter, and result limit where the dataset can grow, and MUST NOT iterate a list re-fetching each related record.

### Server State

[TanStack Query Development](.claude/skills/tanstack-query-development/SKILL.md) owns the pattern in full, and this codebase already follows it: `get<Name>QueryOptions` / `get<Name>MutationOptions` factories under each feature's `queries/` and `mutations/`, consumed directly with `useQuery()` / `useMutation()`.

**Guidelines:**

- MUST use the shared `queryClient` from `src/core/helpers/query-client.ts`; there is exactly one.
- MUST read the Zustand store through `useAuthStore.getState()` **inside** the `queryFn`/`mutationFn`, never in the factory body.
- Existing query keys (`src/collections/queries/collection-list-query.ts`, `collection-records-query.ts`) put tenancy in a trailing filter object — `["collections", scope]` — which the installed skill marks as a Major finding. New queries MUST use the tenancy-rooted form (`["users", userId, "collections", …]`); migrating the existing two is tracked separately.

### Observability

**Guidelines:**

- MUST log through the root logger in `src/core/helpers/logging.ts`, which runs at `debug` severity with two transports: a console transport (`debug` in development only; `info`/`warn`/`error` always) and a breadcrumb transport mirroring every line to the error tracker.
- MUST reach error reporting through the wrappers in `src/core/helpers/error-reporting.ts` — `reportError`, `wrapRootComponent`, `addBreadcrumb` — and MUST NOT import `@sentry/react-native` for capture, breadcrumbs, or initialization anywhere else. (A Sentry **UI** component is a separate matter: `settings-screen.tsx` imports `showFeedbackWidget` directly, which is not error capture.)
- MUST write log messages as a message string first and a single trailing context object, ending the message with a period, and MUST bracket a failable operation with "Started …" / "Completed …" lines.
- MUST NOT put credentials, tokens, raw request bodies, or PII in a log context — every line becomes a breadcrumb.

### Security and Privacy

**Guidelines:**

- MUST validate all external input with Zod: environment variables, deep-link route and search params, API payloads, and database-row parsing.
- MUST NOT place a secret behind an `EXPO_PUBLIC_` variable — those are inlined into the client bundle. The committed `.env` carries only the public Sentry DSN.
- MUST keep Sentry's content collection off. This project is on `@sentry/react-native` 7.x, where that is the `sendDefaultPii: false` currently set in `src/core/helpers/error-reporting.ts`. Newer SDK lines replace that boolean with a structured `dataCollection` option, so MUST check which one the installed SDK accepts before changing it — [Sentry Instrumentation](.claude/skills/sentry-instrumentation/SKILL.md) owns that question, and its rules are verified against the 8.x line.
- MUST NOT perform a state-changing action directly from deep-link parameters without user confirmation.

### Performance

**Guidelines:**

- MUST render remote images through `expo-image` with explicit dimensions, a cache policy, and a priority hint, and MUST give an image inside a virtualized list a `recyclingKey`.
- SHOULD size a bundled asset for its largest rendered use, not the design-tool original.

### Known Deviations from the Installed Skills

Two installed rules disagree with this codebase. Both are deliberate, accepted deviations, recorded here rather than silently violated — neither is sanctioned by an upstream escape hatch.

- **Screen bodies live in `components/`, not `screens/`.** Expo App Development's route-modules reference states a MUST: the screen body belongs in the owning domain's `screens/` directory. This repository has no `screens/` — routes compose from `src/<feature>/components/`. Follow this repository. Note that `expo-app-development` carries **no** general "existing convention wins" carve-out (unlike `tanstack-query-development` and `react-component-development`, which do); its established-convention allowances are each scoped to one subject — the source-root name, the path alias, and the safe-area inset mechanism — and none reaches the screen-body rule. This deviation is therefore a standing, accepted violation of that MUST, not a permitted variation — revisit it if the cost of diverging grows.
- **Two existing query keys use the trailing-filter tenancy shape** the TanStack Query skill forbids. See [Server State](#server-state); new code follows the skill.
