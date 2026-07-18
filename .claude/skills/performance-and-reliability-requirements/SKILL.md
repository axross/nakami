---
name: performance-and-reliability-requirements
description: The reviewer's lens on runtime cost and failure-mode behavior. Covers data-access efficiency and N+1 risk against the Drizzle/expo-sqlite data layer, async waterfalls and loading-boundary splits, list virtualization, TanStack Query caching correctness (query keys, stale time, invalidation), asset/image optimization via expo-image, app bundle and dependency weight, and error-handling/observability hooks.
when_to_use: Use when reviewing runtime cost or failure-mode behavior of a code change — "fast", "cache", "scale", "slow", "bundle", or "what happens when this fails".
user-invocable: false
---

# Performance and Reliability Requirements

Apply these rules when reviewing the runtime cost and failure-mode behavior of any code change. This is the reviewer's lens — flag risks and link to the developer-facing rule rather than restating it.

## Data-Access Efficiency

See [data-access-efficiency.md](./references/data-access-efficiency.md) for:

- Explicit projection, relationship depth, result limit, and filter on every data-layer read
- No N+1 pattern: iterating a list of records and re-fetching each related record one at a time
- The shared `db` client from `src/core/db/client.ts` is the only database entry point
- Visibility-restricted reads do not over-fetch by omitting the appropriate filter

## Async Loading and Rendering Cost

See [async-loading-cost.md](./references/async-loading-cost.md) for:

- Independent async work runs concurrently, not awaited sequentially into a waterfall
- Loading boundaries are placed around independently slow units, and skeletons do not depend on the loaded data shape
- Unbounded lists are virtualized, with stable keys and referentially stable rows
- The React Compiler's auto-memoization is accounted for before adding manual memoization

## Caching Correctness

See [caching-correctness.md](./references/caching-correctness.md) for:

- Query keys contain every input the query function reads
- Stale time / cache lifetime is a deliberately chosen judgment, not an inherited default
- Invalidation is wired on writes — every mutation invalidates (or updates) the queries its write affects
- Invalidation targets the narrowest correct key scope

## Asset and Image Optimization

See [image-optimization.md](./references/image-optimization.md) for:

- Remote images render through `expo-image` with explicit dimensions, cache policy, and priority hints
- Images in virtualized lists carry a `recyclingKey`
- Bundled assets are sized for their largest rendered use, not the design-tool original

## Bundle and Dependency Weight

See [bundle-weight.md](./references/bundle-weight.md) for:

- App code does not import build-time tooling, Node builtins, or test-only packages
- New dependencies are weighed against installed size, native-module cost, and existing equivalents
- Barrel files and namespace imports do not defeat tree-shaking
- Heavyweight moment-of-need code is lazy-loaded off the startup path

## Error Handling and Observability

See [error-and-observability.md](./references/error-and-observability.md) for:

- `try`/`catch` is at the root call site (screen/query/mutation entry point), not in nested helpers, per the project's observability guidelines (error-handling rules)
- The error-reporting call fires before any early "not found" / redirect / return
- Slow or external operations are bracketed by start/complete log pairs per the project's observability guidelines (logging rules)
- New routes/segments have error boundaries when they need custom error UI, and the root/last-resort error boundary is not bypassed
