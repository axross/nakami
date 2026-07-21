# Query Options

Apply this reference when writing or reviewing a `queryOptions()` factory or a `useQuery()` call site. A query factory is a plain function returning `queryOptions({…})`; it owns the cache key and the fetch, and callers consume it with `useQuery(getXQueryOptions(input))`.

## Factory Shape and Parameterization

A query factory takes the inputs the query varies on and returns `queryOptions()`. The inputs flow into both the key and the `queryFn`, so a given call site always maps to the same cache identity.

**Example:**

```ts
import { queryOptions } from "@tanstack/react-query";
import { fetchCollections } from "~/collections/helpers/payload-collections";

export function getCollectionListQueryOptions(serverUrl: string) {
	return queryOptions({
		queryKey: ["collections", "list", serverUrl],
		queryFn: () => fetchCollections(serverUrl),
	});
}
```

**Guidelines:**

- MUST return `queryOptions({…})` from the factory so the returned `queryKey` is branded (`DataTag`) and typed for cache reads and invalidation.
- MUST take every input the query varies on as a factory parameter and thread it into both the `queryKey` and the `queryFn`.
- MUST keep the factory a pure builder — it constructs options only; it calls no React hook and triggers no fetch itself.
- SHOULD accept a narrow input (the ids/filters the query needs), not a whole store slice or a component prop bag.

## Query Keys

The query key is the cache's identity. This skill owns its **structure**; the project's performance-and-reliability guidelines own key **completeness** as a review rule.

**Guidelines:**

- MUST structure a key as a hierarchical, feature-scoped array from broad to narrow: `[feature, kind, …params]`, e.g. `["collections", "list", serverUrl]` or `["collections", "detail", id]`.
- MUST include every `queryFn` input in the key; a missing input collides two different reads into one cache entry. The project's performance-and-reliability guidelines (caching-correctness) enforce this on review.
- MUST derive the key only inside the factory, so `getXQueryOptions(input).queryKey` is the one source used for `getQueryData`, `setQueryData`, and `invalidateQueries`.
- SHOULD NOT put an unstable value (a fresh object literal, a timestamp) in a key; it explodes cache cardinality.

## The queryFn

The `queryFn` runs imperatively when the query executes, so it reads stores and singletons non-reactively — the same discipline as a `mutationFn`.

**Guidelines:**

- MUST read a Zustand store inside a `queryFn` via `useStore.getState()`, never a hook; the factory is not a component.
- MUST let the `queryFn` throw on failure so TanStack marks the query errored (see the error-handling reference); do not swallow the failure and return a sentinel value.
- SHOULD route the actual read through the feature's data-layer/API helper (a Drizzle query, a Payload client call), keeping the `queryFn` a thin adapter over it.

## Consuming and Cache Lifetime

Components consume the factory directly; the shared client default governs lifetime unless a query deliberately overrides it.

**Example:**

```ts
const { data, isPending, error } = useQuery(
	getCollectionListQueryOptions(serverUrl),
);
```

**Guidelines:**

- MUST consume a query with `useQuery(getXQueryOptions(input))` (or `useSuspenseQuery` / `prefetchQuery` with the same factory), never a wrapper hook.
- MUST read cached data through the factory's branded key: `queryClient.getQueryData(getXQueryOptions(input).queryKey)`.
- SHOULD inherit the shared client's `staleTime` (30s) and override it per-query only as a deliberate choice; the project's performance-and-reliability guidelines own that judgment.
- MAY layer a per-call option (e.g. `enabled`) by spreading the factory: `useQuery({ ...getXQueryOptions(input), enabled })`.
