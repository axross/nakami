---
name: routing-guidelines
description: Expo Router conventions for payload-mobile — the src/app/ route tree, thin route files delegating to feature components, layout files, typed routes, deep-link handling under the payloadmobile:// scheme, and route-level loading/error surfaces.
when_to_use: Use when creating, moving, renaming, or reviewing routes — route files, layouts, navigation calls, deep links, or route-level loading and error behavior.
user-invocable: false
---

# Routing Guidelines

This skill owns the routing layer. Where non-route files live belongs to Project Structure; how the screens themselves are built belongs to Component Guidelines (both resolved via the `AGENTS.md` skill index).

Routing is file-based via Expo Router: every file under `src/app/` is a route, `_layout.tsx` files nest navigators, and typed routes are enabled (`experiments.typedRoutes`), so route paths are compile-checked.

## Route Files

A route file is a thin entry point: it declares screen options and composes the owning feature's components. Feature logic in a route file couples the feature to the navigation tree.

**Guidelines:**

- MUST keep route files thin — screen options plus composition of components from `src/<feature>/components/`; substantial logic moves into the feature (see Maintainable Code Guidelines, abstraction-boundaries rules).
- MUST name route segments kebab-case; dynamic segments use Expo Router's `[param]` convention.
- MUST default-export the screen component; route files are the only files under `src/app/`.
- MUST set the screen title via `Stack.Screen` options (or the owning layout), not by rendering a bespoke header.

## Layouts and Navigation

**Guidelines:**

- MUST put cross-cutting providers (QueryClientProvider, error-reporter wrap, status bar) only in the root `src/app/_layout.tsx`; nested layouts own only their navigator.
- MUST import `~/unistyles` first in the root layout so themes are registered before any styled component renders.
- MUST navigate with Expo Router's typed APIs (`<Link href>`, `router.push/replace`) — never hand-built string concatenation for parameterized routes.
- SHOULD prefer `<Link>` over imperative navigation when the trigger is a plain press.

## Deep Links

Every route is reachable via the `payloadmobile://` scheme from other apps and web pages.

**Guidelines:**

- MUST parse and validate route/search params with a Zod schema before use — deep-link parameters are untrusted external input (see Application Security Requirements, access-control and input-validation rules).
- MUST NOT perform a state-changing action directly from deep-link parameters without user confirmation.

## Loading and Error Surfaces

**Guidelines:**

- MUST give each data-backed screen a loading state that renders without the loaded data, propagating the screen's `testID` convention to the fallback (see Performance and Reliability Requirements, async-loading rules).
- MUST keep the root error boundary (the error-reporter wrap in the root layout) intact; a route needing custom error UI adds its own boundary beneath it, per Observability Guidelines.
- SHOULD give unmatched routes a friendly `+not-found.tsx` screen once the app has more than one route.
