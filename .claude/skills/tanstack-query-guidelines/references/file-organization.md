# File and Factory Organization

Apply this reference when placing or naming a TanStack Query factory, or deciding whether a piece of server-state logic is an option factory at all. The project is organized by feature (see the project-structure skill); queries and mutations follow that same by-feature split.

## Directory Placement

Each feature owns its query and mutation definitions. A query or mutation used by one feature stays in that feature; the shared `queryClient` and other cross-cutting infrastructure live in `src/core/`.

**Example:**

```
src/
├── collections/
│   ├── queries/
│   │   ├── collection-list-query.ts
│   │   └── collection-detail-query.ts
│   └── mutations/
│       └── collection-create-mutation.ts
└── auth/
    └── mutations/
        ├── sign-in-mutation.ts
        └── sign-out-mutation.ts
```

**Guidelines:**

- MUST place a query factory in `src/<feature>/queries/` and a mutation factory in `src/<feature>/mutations/`, per the project-structure skill's by-feature layout.
- MUST create the `queries/` or `mutations/` directory when a feature's first factory lands; do not add an empty placeholder directory before then.
- MUST keep a factory in `src/common/` only when it is genuinely consumed by two or more features; a single-consumer factory stays feature-local.
- MUST NOT put a raw data-layer read or write (a Drizzle call, a `fetch`) directly in a component; route it through a query or mutation factory so it has a cache key and an invalidation hook.

## File and Factory Naming

One factory per file, named for what it fetches or does, keeps the module map predictable and every factory greppable by a single stable name.

**Guidelines:**

- MUST name a query file `<name>-query.ts` and a mutation file `<name>-mutation.ts`, kebab-case (`collection-list-query.ts`, `sign-in-mutation.ts`).
- MUST name a query factory `get<Name>QueryOptions` and a mutation factory `get<Name>MutationOptions`, matching the file (`getCollectionListQueryOptions`, `getSignInMutationOptions`).
- MUST export exactly one option factory per file, and colocate only its directly-supporting types (e.g. an input interface) in that same file.
- SHOULD NOT add a barrel `index.ts` that re-exports factories; import each factory by its own path. Barrel files defeat tree-shaking — the project's performance-and-reliability guidelines (bundle-weight rules) own that concern.

## Option Factory vs. Plain Hook

The option-factory pattern is for TanStack Query server-state — data fetched or mutated through the query client. A genuine lifecycle or effect hook that orchestrates React state is not a query and stays a hook, even when it reads a store.

**Examples:**

> `getSignInMutationOptions()` is server-state (a network write plus a session/store update) → a mutation factory under `mutations/`.

> `useSessionBootstrap()` runs an effect to hydrate a Zustand store and hide the splash screen → stays a hook under the feature's `hooks/`, not a factory.

**Guidelines:**

- MUST express a cached data read as a `queryOptions()` factory and a server write as a `mutationOptions()` factory — never a bespoke `useX` hook wrapping `useQuery`/`useMutation`.
- MUST keep a hook whose job is React lifecycle/effect orchestration (timers, `AppState`, splash, store hydration) as a hook under the feature's `hooks/`; it is not a query even when it reads a store.
- MUST NOT wrap an option factory in a thin feature hook just to hide `useQuery`/`useMutation`; the component calls `useQuery(getX(input))` / `useMutation(getX())` directly.
