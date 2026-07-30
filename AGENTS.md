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
- [Project Conventions](#project-conventions) below carries the rules specific to this repository — everything the installed skills cannot know.

## Skill Index

The skills under [`.claude/skills/`](./.claude/skills) are **installed copies** from [`axross/skills`](https://github.com/axross/skills), pinned by [`skills-lock.json`](./skills-lock.json). None is hand-written here, and a hand-edit to one is discarded by the next reinstall — see [Skill Maintenance](#skill-maintenance). Consult the relevant skill before acting on matching work.

| Skill                                                                                                    | When to apply                                                                                                                                          |
| -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Professional Behavior](.claude/skills/professional-behavior/SKILL.md)                                   | Every session — resolving uncertainty at its right source, researching current sources, accuracy discipline, and reporting back                        |
| [Software Development](.claude/skills/software-development/SKILL.md)                                     | Every task that touches the project — the format/lint loop, scoped changes, project docs, verification, current docs, pull request descriptions        |
| [Loop Engineering](.claude/skills/loop-engineering/SKILL.md)                                             | Driving a change end-to-end through plan → code → review, including the plan-approval gate and the independent review                                  |
| [Product Requirement Document Authoring](.claude/skills/product-requirement-document-authoring/SKILL.md) | Writing or refining a requirement, spec, plan document, or issue description, and deciding which sections it needs                                     |
| [Technical Document Authoring](.claude/skills/technical-document-authoring/SKILL.md)                     | Drafting, structuring, or editing a technical document — a design doc, ADR, runbook, README, or this file's prose                                       |
| [Conventional Commits](.claude/skills/conventional-commits/SKILL.md)                                     | Authoring a commit message or a pull request title                                                                                                     |
| [GitHub Operation](.claude/skills/github-operation/SKILL.md)                                             | Any GitHub read or write — issues, pull requests, comments, labels, reviews, branches — through the harness's tool channel                             |
| [Code Review](.claude/skills/code-review/SKILL.md)                                                       | Reviewing a diff, pull request, or your own change before calling it done                                                                              |
| [Quality Assurance](.claude/skills/quality-assurance/SKILL.md)                                           | Judging whether a change carries adequate verification evidence                                                                                        |
| [Code Maintainability](.claude/skills/code-maintainability/SKILL.md)                                     | Naming, file organization, abstraction boundaries, complexity, dead code, scope discipline                                                              |
| [Application Security](.claude/skills/application-security/SKILL.md)                                     | Untrusted input, secrets, outbound requests, rendered content, access control, dependency risk                                                          |
| [Software Instrumentation](.claude/skills/software-instrumentation/SKILL.md)                             | Logging, throwing, catching, reporting an error, tracking an event, or configuring a logger or error tracker                                            |
| [Sentry Instrumentation](.claude/skills/sentry-instrumentation/SKILL.md)                                 | The Sentry vendor layer beneath the above — `Sentry.init`, the DSN, data-collection options, source maps, capture and scopes, the Expo/React Native wiring |
| [Expo App Development](.claude/skills/expo-app-development/SKILL.md)                                     | The framework layer — project layout, routes and navigators, app config and config plugins, permissions, safe areas, assets, startup, SDK upgrades      |
| [React Component Development](.claude/skills/react-component-development/SKILL.md)                       | A component's composition, props contract, extracted logic, state, memoization, loading and error surfaces, test hooks, virtualization                  |
| [React Component Styling](.claude/skills/react-component-styling/SKILL.md)                               | A component's styles — Unistyles stylesheets, tokens, theming, adaptive and responsive behavior                                                         |
| [TanStack Query Development](.claude/skills/tanstack-query-development/SKILL.md)                          | Server state — option factories, query keys, cache lifetime, invalidation, mutations, optimistic updates, and their tests                               |
| [Unit Testing](.claude/skills/unit-testing/SKILL.md)                                                     | Writing, refactoring, reviewing, or running unit tests                                                                                                 |
| [End-to-End Testing](.claude/skills/end-to-end-testing/SKILL.md)                                          | Writing, running, reviewing, or maintaining end-to-end tests and scenario coverage                                                                     |
| [Wireframe Design](.claude/skills/wireframe-design/SKILL.md)                                             | Producing a low-fidelity wireframe, breadboard, or wireflow                                                                                            |
| [High-Fidelity UI Design](.claude/skills/high-fidelity-ui-design/SKILL.md)                               | Designing or reviewing a high-fidelity surface with real color, type, spacing, and interaction states — pair it with [the design kit](#the-high-fidelity-design-kit) |
| [Agent Skill Authoring](.claude/skills/agent-skill-authoring/SKILL.md)                                   | Writing or auditing a `SKILL.md` — framing, frontmatter, discovery text, the structure validator                                                        |
| [Agent Skill Management](.claude/skills/agent-skill-management/SKILL.md)                                 | Installing, refreshing, or proposing a change to a skill, and deciding where a skill's source belongs                                                   |

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
  - `theme.text.*` — composite text roles bundling family, size, and line height, named for the content they carry: `display` (28/34) for a screen's hero title, `title` (20/26) for a message state's title, `heading` (16/22) for body metrics emphasized — button labels, card titles, section headings, `body` (16/22) for running text, inputs, and row labels, `label` (13/18) for a form field's name, `caption` (13/18) for secondary supporting text, `code` (14/22) for an identifier standing in for a title, and `codeCaption` (13/18) for machine-readable text in a supporting position. A style MUST apply a role whole (`...theme.text.body`) and MUST NOT pick values out of it. The font families are module-private inside `style.ts` — there is no `theme.fonts`, because a family without its size is half a typography decision. Weight is carried by the family file (`InnovatorGrotesk-SemiBold` vs `-Regular`), so a role sets no `fontWeight`; adding one makes React Native synthesize a second weight on top of the real one. The 22pt line box shared by `heading`, `body`, and `code` is what keeps a record card's height deterministic.
- MUST NOT hard-code a color, an on-scale spacing or radius value, or any part of a text style — `fontSize` included; a size with no role is a missing role, not an exception. Inlined numeric literals are limited to fixed element dimensions (an icon's drawn size, a fixed line box such as `RECORD_CARD_LINE`) and 1px hairlines.
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

Expo App Development owns the routing layer. These three rules have no owner there and are stated here instead.

**Guidelines:**

- MUST give each data-backed screen a loading state that renders without the loaded data, propagating the screen's `testID` convention to the fallback so e2e flows can assert it.
- MUST keep the root error boundary (the error-reporter wrap in `src/app/_layout.tsx`) intact; a route needing custom error UI adds its own boundary beneath it.
- SHOULD give unmatched routes a friendly `+not-found.tsx` screen once the app has more than one route (tracked as issue #8).
- Every route is reachable via the `nakami://` deep-link scheme (`app.json` → `scheme`); parameters arriving through it are untrusted input.

### Data Layer

**Guidelines:**

- MUST define tables in `src/core/db/schema.ts` and commit the migration generated by `npm run db-migrate:generate` alongside the schema change.
- MUST NOT hand-edit or amend a file under `src/core/db/migrations/` — they are generated. Change the schema and generate a new migration instead.
- MUST reach the database only through the shared client in `src/core/db/client.ts`; feature-level access (queries/mutations wrapping that client) stays in the owning feature.
- MUST wire Drizzle's expo-sqlite migrator (`useMigrations`) into `src/app/_layout.tsx` as part of the change that lands the first migration — it is **not** wired yet, so until then a migration would never run.
- MUST give every data-layer read an explicit projection, filter, and result limit where the dataset can grow, and MUST NOT iterate a list re-fetching each related record.

### Server State

TanStack Query Development owns the pattern in full, and this codebase already follows it: `get<Name>QueryOptions` / `get<Name>MutationOptions` factories under each feature's `queries/` and `mutations/`, consumed directly with `useQuery()` / `useMutation()`.

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
- MUST keep Sentry's content collection off. This project is on `@sentry/react-native` 7.x, where that is the `sendDefaultPii: false` currently set in `src/core/helpers/error-reporting.ts`. Newer SDK lines replace that boolean with a structured `dataCollection` option, so MUST check which one the installed SDK accepts before changing it — Sentry Instrumentation owns that question, and its rules are verified against the 8.x line.
- MUST NOT perform a state-changing action directly from deep-link parameters without user confirmation.

### Performance

**Guidelines:**

- MUST render remote images through `expo-image` with explicit dimensions, a cache policy, and a priority hint, and MUST give an image inside a virtualized list a `recyclingKey`.
- SHOULD size a bundled asset for its largest rendered use, not the design-tool original.

### Known Deviations from the Installed Skills

Two installed rules disagree with this codebase. Both are deliberate, accepted deviations, recorded here rather than silently violated — neither is sanctioned by an upstream escape hatch.

- **Screen bodies live in `components/`, not `screens/`.** Expo App Development's route-modules reference states a MUST: the screen body belongs in the owning domain's `screens/` directory. This repository has no `screens/` — routes compose from `src/<feature>/components/`. Follow this repository. Note that `expo-app-development` carries **no** general "existing convention wins" carve-out (unlike `tanstack-query-development` and `react-component-development`, which do); its established-convention allowances are each scoped to one subject — the source-root name, the path alias, and the safe-area inset mechanism — and none reaches the screen-body rule. This deviation is therefore a standing, accepted violation of that MUST, not a permitted variation — revisit it if the cost of diverging grows.
- **Two existing query keys use the trailing-filter tenancy shape** the TanStack Query skill forbids. See [Server State](#server-state); new code follows the skill.

## Response Approach

Use this workflow for single-agent work in this project. The agent owns planning, implementation, investigation, verification, review, and reporting directly.

### Overall Strategy

Non-trivial work should move through the same decision sequence even when some steps are brief.

1. Classify the request and load the relevant project guidance.
2. Define success criteria, constraints, affected surface, dependencies, and verification expectations.
3. Inspect the smallest useful code and documentation context.
4. Draft an ordered local workflow with acceptance criteria.
5. Implement, investigate, or review within the narrowest scope that satisfies the request.
6. Self-review the result as a separate phase.
7. Run or report the relevant verification.
8. Update the project conventions above when the work exposes reusable project learning.
9. Summarize outcome, verification status, trade-offs, and open follow-ups.

**Guidelines:**

- MUST consult [Software Development](.claude/skills/software-development/SKILL.md) at the start of every task, and [Professional Behavior](.claude/skills/professional-behavior/SKILL.md) in every session.
- MUST classify non-trivial work as user-facing, implementation-only, review-only, skill-maintenance, exploratory, or mixed workflow before editing files.
- MUST consult every skill whose routing condition matches the changed surface or requested review lens, and the matching [Project Conventions](#project-conventions) subsection.
- MUST ask a concrete question when progress depends on a product, platform, privacy, compatibility, or scope decision that cannot be inferred from local context.
- SHOULD compress the sequence for small answer-only requests without skipping relevant safety checks.

### Planning and Execution

Planning exists to make the work checkable. It should name what changes, what must stay unchanged, and how the result will be verified.

**Guidelines:**

- MUST restate success criteria, constraints, affected surface, and verification expectations before non-trivial edits.
- MUST preserve public behavior during refactors unless the requested change intentionally modifies it.
- MUST keep edits scoped to the smallest surface that satisfies the acceptance criteria.
- SHOULD inspect independent discovery targets in parallel when their outputs do not depend on each other.
- SHOULD revise the plan when new evidence changes affected files, risks, or acceptance criteria.

### User-Facing Work

User-facing changes need design intent before implementation mechanics. The single agent owns both, but the phases must stay distinct.

**Guidelines:**

- MUST establish design intent before implementing user-facing changes: hierarchy, interaction states, accessibility intent, responsive behavior, and copy constraints.
- MUST consult [React Component Development](.claude/skills/react-component-development/SKILL.md) and [React Component Styling](.claude/skills/react-component-styling/SKILL.md) for implementation mechanics, [Expo App Development](.claude/skills/expo-app-development/SKILL.md) where routes or navigators are involved, and [Components and Theming](#components-and-theming) for this repository's patterns and tokens.
- MUST express design intent in user-facing terms before translating it into components, styles, or tests.
- MUST verify that text, layout, focus behavior, loading states, and responsive behavior remain coherent across relevant viewports or surfaces.

### Review Independence Gates

A single agent cannot provide true independent review. This project compensates with a mandatory separate review phase for ordinary work and external review gates for high-risk work.

**Guidelines:**

- MUST perform a reviewer-mode reset after non-trivial implementation: stop editing, reread the request, inspect `git status` and `git diff`, and review only the produced diff.
- MUST apply [Code Review](.claude/skills/code-review/SKILL.md) during self-review, including severity labels, file-line evidence, concrete fixes, and an explicit verdict when findings exist.
- MUST load topic-specific review lenses when relevant: maintainability, quality assurance, security, instrumentation, component, styling, server-state, Expo-framework, and testing.
- MUST judge the actual diff and observed behavior, not the implementation intent.
- MUST fix Critical or Major self-review findings before claiming completion, and re-review after fixing any blocking finding.
- MUST report verification evidence before completion: commands run, manual checks, failures, skipped checks, and residual risk.
- MUST escalate high-risk changes to user review or the independent review before calling them merge-ready, routed through the posted-review policy in [REVIEW.md](./REVIEW.md).
- SHOULD treat auth, access control, injection/output-encoding, SSRF/outbound fetching, data-layer migrations, public route contracts, production config, data-loss risk, and large refactors as high-risk.

### Verification

Verification should match the changed surface. Documentation-only changes need link and format checks; routes, user-facing output, data-layer, and runtime changes need stronger evidence. [`README.md`](./README.md) carries the full command table.

**Guidelines:**

- MUST run the relevant verification commands after non-trivial changes, or report why they could not run.
- MUST run `npm run format` and `npm run lint` after code or documentation edits.
- MUST run `npm run typecheck` after a change to any TypeScript surface.
- MUST run `npm run test:unit` after a change affects code it covers.
- MUST run `npm run test:e2e` after a change affects a user-facing output surface or e2e coverage (at minimum `npm run test:e2e:coverage` when no simulator is available, reporting the skipped on-device run).
- MUST run `npm run build` after a change affects routes, app config, data-layer config, runtime config, dependencies, or public type signatures.
- SHOULD perform focused manual checks when platform-specific native behavior, deep-link handling, or responsive layout across device sizes changes.
- MUST report unverified acceptance criteria and residual risk in the final summary.

### Skill Maintenance

The skills are installed from [`axross/skills`](https://github.com/axross/skills), not authored here. That changes where a rule change goes.

**Guidelines:**

- MUST NOT hand-edit a file under `.claude/skills/` — the next reinstall discards it. Consult [Agent Skill Management](.claude/skills/agent-skill-management/SKILL.md) for the correct route.
- MUST record a rule that is specific to this repository in [Project Conventions](#project-conventions) above, not in an installed skill.
- MUST open a feature request against `axross/skills` for a rule that belongs upstream — a gap in general practice rather than a nakami fact.
- MUST refresh the installed copies with the command documented in [`README.md`](./README.md), and commit the regenerated directories together with `skills-lock.json`.
- SHOULD state whether skill maintenance was performed, skipped, or blocked when skill guidance governed the work.

### Communication

User-facing communication should expose decisions, blockers, verification, and outcomes without narrating every local inspection step.

**Guidelines:**

- MUST keep progress updates concise and focused on decisions, blockers, and outcomes.
- MUST summarize changed files, verification status, trade-offs, unresolved risks, and deferred follow-ups at completion.
- SHOULD include detailed plans, command logs, or iteration logs only when the user asks for auditability or when the outcome depends on them.
- MUST ask a concrete question when progress depends on a product, platform, privacy, or scope decision.
