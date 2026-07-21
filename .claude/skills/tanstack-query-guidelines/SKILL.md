---
name: tanstack-query-guidelines
description: "How payload-mobile organizes TanStack Query: server-state reads and writes live as queryOptions()/mutationOptions() factory functions under each feature's queries/ and mutations/ directories — getXQueryOptions()/getXMutationOptions() — consumed directly with useQuery()/useMutation() rather than wrapped in a bespoke per-operation custom hook. The factory is the single typed source of a query's cache key, so invalidation reads invalidateQueries({ queryKey: getXQueryOptions().queryKey }). Covers file and factory naming, query-key structure, non-reactive Zustand access from a factory, the query-versus-mutation error-handling strategy, typed invalidation, and testing option factories and their consumers."
when_to_use: "Apply when adding, moving, reviewing, or refactoring any TanStack Query code — a query or mutation, a queryOptions()/mutationOptions() factory, a useQuery()/useMutation() call site, a query key, cache invalidation, or query/mutation error handling — and when deciding whether server-state logic belongs under queries/ or mutations/ or should stay a plain lifecycle hook."
user-invocable: false
---

# TanStack Query Guidelines

How payload-mobile organizes server-state and mutations with TanStack Query (`@tanstack/react-query` v5). The rule is one pattern, applied everywhere: a query or mutation is an **option-factory function** — `getXQueryOptions()` returning `queryOptions({…})`, `getXMutationOptions()` returning `mutationOptions({…})` — that lives under its feature's `queries/` or `mutations/` directory and is consumed directly with `useQuery(…)` / `useMutation(…)`. There is no bespoke per-operation custom hook (`useSignIn`, `useCollectionList`): the factory owns the cache identity and the fetch/side-effect logic, the component owns the reactive wiring.

The factory doubles as the typed source of a query's cache key, which is what makes invalidation type-safe instead of a stringly-typed guess:

```ts
// src/collections/queries/collection-list-query.ts
export function getCollectionListQueryOptions() {
	return queryOptions({
		queryKey: ["collections"],
		queryFn: () => fetchCollections(),
	});
}

// wherever a write invalidates the list — the key is typed, derived from the factory:
queryClient.invalidateQueries({
	queryKey: getCollectionListQueryOptions().queryKey,
});
```

This skill owns the **pattern and mechanics**. The cache-correctness review rules (query-key completeness, `staleTime` choice, invalidation wiring and scope) stay owned by the project's performance-and-reliability guidelines, and error-logging levels and error-tracker capture stay owned by the project's observability guidelines; this skill references them rather than restating them.

## File and Factory Organization

See [file-organization.md](./references/file-organization.md) for:

- placing a query or mutation under `src/<feature>/queries/` or `src/<feature>/mutations/`
- naming the file (`<name>-query.ts` / `<name>-mutation.ts`) and the factory (`getXQueryOptions` / `getXMutationOptions`)
- deciding whether server-state logic is an option factory or a plain lifecycle hook
- keeping one factory per file and avoiding barrel re-exports

## Query Options

See [query-options.md](./references/query-options.md) for:

- writing a `getXQueryOptions(input?)` factory with `queryOptions()`
- structuring a REST-path-mirroring query key (resource-kind / id segments, lists dropping the trailing id, filters in a trailing object)
- reading stores and singletons non-reactively inside a `queryFn`
- consuming with `useQuery()`, prefetching, and reading cache through the branded key
- choosing `staleTime` against the shared client default

## Mutation Options

See [mutation-options.md](./references/mutation-options.md) for:

- writing a `getXMutationOptions()` factory with `mutationOptions()` and a feature-scoped `mutationKey`
- reading the Zustand store at call time via `getState()` inside a `mutationFn`
- splitting operation-intrinsic callbacks (factory) from view callbacks (call site)
- invalidating affected queries with the imported `queryClient` and a factory's `queryKey`

## Error Handling

See [error-handling.md](./references/error-handling.md) for:

- catching a tolerable failure inside a `mutationFn` versus letting it reject
- where a raw domain error surfaces and where it is mapped to user copy
- handling query errors in v5 (returned `error`, an error boundary, or the global `QueryCache`) now that per-query callbacks are gone
- retry defaults and the log-versus-report ownership boundary

## Testing

See [testing.md](./references/testing.md) for:

- rendering an option-factory consumer under a `QueryClientProvider`, or mocking `useQuery`/`useMutation`
- injecting `mutate`/`isPending`/`error` state without a live client
- mocking the data-layer/API dependency a factory calls
- what to assert on an option factory versus its consuming component
