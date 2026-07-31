---
name: project-structure
description: The structure and conventions of Nakami, an Expo (React Native) companion app for Payload CMS — the facts the installed skill library cannot know about it. Covers the source-tree layer model and its one-way import direction, feature/common/core placement, the `~/*` path aliases, kebab-case naming and colocated tests, the two-layer Expo app config, hand-rolled compound components and the shared-component catalog, the Unistyles theme tokens and breakpoints, Lucide icons, accessibility and `testID` conventions, the high-fidelity design kit, screen loading and error states, Drizzle over expo-sqlite, TanStack Query option factories and query-key shape, the root logger and error-reporting wrappers, Zod validation and the `EXPO_PUBLIC_` secret boundary, image performance rules, and the one accepted deviation from an installed skill rule.
when_to_use: Use when locating a file, placing or naming a new module, or resolving any "how does this project do it" question an installed capability defers to the project on — which directory a module belongs in, whether one module may import another, which theme token to reach for, how a component splits into parts, what a screen renders while loading, how a query key is shaped, which logger or error-reporting wrapper to call, or where a secret may not go. Consult it alongside the installed capability for the surface being changed, which owns the underlying practice; this skill owns only what is specific to this repository.
user-invocable: false
---

# Project Structure

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119.html).

Apply this skill when navigating this repository, placing or naming a new file, or answering a question about how this particular project does something.

It is deliberately narrow: it holds the project-specific half of rules whose general half lives in an installed capability. The Expo app development capability owns Expo Router and app-config mechanics; this skill owns the layer model and the route conventions this repository actually uses. The React component development and styling capabilities own component anatomy and styling in the abstract; this skill names the tokens, the catalog, and the composition pattern in force. The TanStack Query capability owns the server-state pattern; this skill records the query-key shape. The software instrumentation and application security capabilities own logging and input validation as disciplines; this skill names the logger, the error-reporting wrappers, and the secret boundary. Where a general capability says "follow the project's convention", this is the convention.

Two neighbors own what this skill does not. Design rationale — hierarchy, contrast, motion taste — belongs to the high-fidelity UI design capability; this skill supplies only the tokens that rationale is spent through. And how work runs here — the mandatory change loop, the skills that load in every session, the verification a changed surface requires, and the review policy — belongs to the repository's working agreement in `CLAUDE.md`, not here.

## Stack

- **Language and framework** — TypeScript on Expo (React Native), with Expo Router file-based routing.
- **State** — Zustand for client state, TanStack Query for server state.
- **Data** — Drizzle ORM over `expo-sqlite` on device; Zod for validating every external input.
- **Styling** — `react-native-unistyles`, with hand-rolled compound components on React Native primitives and no UI component library.
- **Icons** — `lucide-react-native`, the app's single icon set.
- **Observability** — a root logger in `src/core/helpers/logging.ts` and `@sentry/react-native` behind the wrappers in `src/core/helpers/error-reporting.ts`.
- **Tooling** — Biome for format and lint, Jest (`jest-expo`) for unit tests, Maestro for e2e flows.
- **Versions** — `README.md` owns the version table and the dependencies whose docs need refreshing before a change; this skill deliberately states none, so it cannot drift.

## Repository Layout and File Placement

See [repository-map.md](./references/repository-map.md) for:

- deciding which directory a new module belongs in, and when to create a feature directory
- the one-way import direction through the layers, and the two ratified exceptions to it
- the `~/*` and `~/assets/*` path aliases, and when a relative import is allowed instead
- kebab-case file naming and colocated unit tests
- the two Expo app-config layers, and why a value set in only one of them may not ship

## Components and Theming

See [components-and-theming.md](./references/components-and-theming.md) for:

- the shared-component catalog, and composing an existing component instead of re-creating its look
- compound-component anatomy: one directory per component, one file per part, and the private variant context
- the Unistyles theme tokens — color roles and tones, the spacing-and-radius scale, the font families
- the registered breakpoints and the adaptive-theme setting that swaps themes under a mounted screen
- what may still be inlined as a numeric literal, and what may not
- sourcing icons, accessibility requirements, `testID` placement for Maestro, and bespoke SVG
- when a feature-local pattern is promoted to the shared catalog
- reconciling the high-fidelity design kit's hand-maintained token mirror before a design round

## Routing, Data, and Server State

See [routing-and-data.md](./references/routing-and-data.md) for:

- what a data-backed screen renders before its data arrives, and where an error boundary belongs
- the `nakami://` deep-link scheme, and treating its parameters as untrusted input
- defining tables, generating migrations, and the migrator that is not wired yet
- reaching the database only through the shared client, and bounding a read that can grow
- the query and mutation option factories, the single shared query client, and reading the auth store inside the function rather than the factory body
- the query-key shape new code uses, and the two existing keys that do not

## Observability, Security, and Performance

See [runtime-conventions.md](./references/runtime-conventions.md) for:

- logging through the root logger, its two transports, and the message-plus-context shape
- reaching Sentry only through the error-reporting wrappers, and the one UI-component exception
- what must never appear in a log context, since every line becomes a breadcrumb
- validating external input with Zod, and the `EXPO_PUBLIC_` secret boundary
- the Sentry content-collection setting this SDK line uses, and checking before changing it
- confirming a state-changing action that arrived through a deep link
- rendering remote images and sizing bundled assets

## Known Deviations from the Installed Skills

See [known-deviations.md](./references/known-deviations.md) for:

- the one installed rule this codebase deliberately does not follow, and why it was accepted
- why screen bodies living in `components/` rather than `screens/` is a naming choice and not a violation, so it is not raised as one
- the query-key shape two existing modules still use, and the issue tracking their migration
- recording a new collision here rather than violating an installed skill silently
