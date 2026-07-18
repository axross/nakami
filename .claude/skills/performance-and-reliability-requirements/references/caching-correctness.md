# Caching Correctness

Apply these rules to verify that caching is applied with a deliberate lifetime and scope, and that invalidation is wired on writes. In this project the cache is TanStack Query (`staleTime`/`gcTime`, query keys, `invalidateQueries`) in front of Drizzle/expo-sqlite reads and any remote fetches.

## Query-Key Completeness

A query key is the cache's identity: an input that affects the result but is missing from the key makes two different reads collide into one cached entry.

**Guidelines:**

- MUST flag a Critical when a query function reads an input (an ID, a filter, a search term, an account/server context) that is not part of its query key. The cached result will be replayed for the other input.
- MUST flag a Major when a query key includes a value that effectively makes it unique per call (e.g., a timestamp, a random ID, an unstable object literal recreated each render). Cardinality explosion is a memory leak.
- SHOULD point to the project's established key-factory pattern (per-feature key helpers) rather than ad-hoc inline key arrays.

## Cache Lifetime Choice

A `staleTime` encodes a judgment about how long stale data is tolerable, and library defaults shift between versions — an unstated judgment is one nobody validated.

**Guidelines:**

- MUST flag a Major when a new query's lifetime is mismatched to the data's actual mutability:
  - Too short for data that changes only on rare edits — wastes reads and re-renders
  - Too long for data the user just edited — stale UI
  - The `queryClient` default (`staleTime: 30s`) is the baseline; deviations should be deliberate per-query overrides.
- SHOULD flag a Minor when a new bespoke lifetime is introduced for a one-off purpose without considering whether the project default suffices.

## Invalidation Wiring

Stale-time expiry is the fallback, not the mechanism: freshness after an edit depends on the write actively evicting what it just made stale.

**Guidelines:**

- MUST flag a Critical when a new mutation writes data that backs existing queries without a corresponding `invalidateQueries` (or cache update) in its success path. Without it, edits leave stale UI until the stale time elapses.
- MUST flag a Critical when a write bypasses the mutation layer entirely (a raw Drizzle write inside a component or helper) and therefore has no invalidation hook at all — route writes through the feature's mutations.
- SHOULD flag a Minor when an optimistic update lacks a rollback path on mutation error.

## Invalidation Scope

Wrong scope fails in both directions — too broad discards warm cache for unaffected views, too narrow leaves shared UI stale past the edit.

**Guidelines:**

- MUST flag a Major when invalidation targets a broader key prefix than the write affects (e.g., invalidating a whole feature's keys for a single-record edit) or a narrower one that misses a derived list/summary query.
- MUST flag a Critical when the invalidation target is built from unvalidated user input.

## External-Fetch Cache Specifics

A cached external fetch exists to shield a remote dependency (the Payload MCP backend, any third-party API) from per-interaction traffic, and it only shields anything while many calls share one cache key.

**Guidelines:**

- MUST flag a Critical when a cached external-fetch helper is changed to vary by call-time inputs that explode the cache key.
- SHOULD flag a Minor recommendation that newly-added external-fetch helpers bracket their work with start/complete log pairs carrying a `duration`, so cache misses are observable. See the project's observability guidelines (logging rules).
