# Mutation Options

Apply this reference when writing or reviewing a `mutationOptions()` factory or a `useMutation()` call site. A mutation factory returns `mutationOptions({…})`; the component consumes it with `useMutation(getXMutationOptions())` and passes per-call callbacks at the `mutate(…)` site.

## Factory Shape

A mutation factory returns `mutationOptions()` with a `mutationKey` (see Mutation Keys below) and a `mutationFn`. TanStack treats the key as optional, but the project includes it so in-flight state is filterable (`useIsMutating`, `useMutationState`) and shared defaults have a target.

**Example:**

```ts
import { mutationOptions } from "@tanstack/react-query";
import { useAuthStore } from "~/auth/stores/auth-store";

export function getSignOutMutationOptions() {
	return mutationOptions({
		mutationKey: ["auth-session", "current", "sign-out"],
		mutationFn: async (): Promise<void> => {
			const { session, deauthenticate } = useAuthStore.getState();
			// …best-effort remote logout, then always deauthenticate.
		},
	});
}
```

**Guidelines:**

- MUST return `mutationOptions({…})` from the factory, with a `mutationKey` (see Mutation Keys) and a typed `mutationFn`.
- MUST type the `mutationFn` variables and return value so `useMutation` infers `TVariables`/`TData` at the call site (`TError` defaults to `Error` in v5).
- MUST keep the factory hook-free and side-effect-free at build time; calling it only constructs the options object.

## Mutation Keys

A `mutationKey` follows the same REST-path structure as a query key — the target resource's `[kind, id, …]` path — with the **action verb appended as the final segment**. It exists so in-flight state is filterable (`useIsMutating`, `useMutationState`) and shared defaults have a target; it is not a cache-read identity like a `queryKey`.

**Example:**

```ts
["auth-session", "current", "sign-out"]   // end the current session
["auth-session", "sign-in"]               // establish (create) the session
["collections", "create"]                 // create a collection
["collections", collectionSlug, "update"] // update one collection
["collections", collectionSlug, "delete"] // delete one collection
```

**Guidelines:**

- MUST build a `mutationKey` from the target resource's REST path — the same `[kind, id, …]` shape as its `queryKey` — with the action verb as the final segment.
- MUST omit the identifier for a create (the resource does not exist yet) — `["collections", "create"]` — and include it for an action on an existing resource — `["collections", slug, "update"]`.
- MUST key an action on the current auth session against the `auth-session` resource — `["auth-session", "current", "sign-out"]` to end it, `["auth-session", "sign-in"]` to establish it.
- SHOULD keep the action verb a bare imperative (`create`, `update`, `delete`, `sign-in`, `sign-out`) naming what the `mutationFn` does.

## Non-Reactive Dependencies

A `mutationFn` runs imperatively at `mutate(…)` time, so it reads current state directly rather than a render-time snapshot — which also avoids the stale-closure bug a hook-captured value would carry.

**Guidelines:**

- MUST read a Zustand store inside the `mutationFn` via `useStore.getState()`, never a hook call; a factory has no React context.
- MUST reach the shared `queryClient` for cache work by importing the singleton from `~/core/helpers/query-client`, not `useQueryClient()`.
- SHOULD read the store at the point of use inside the `mutationFn`, so the freshest value is used (e.g. the current session at sign-out time).

## Factory vs. Call-Site Callbacks

Where a callback lives encodes who owns the concern: the operation itself, or the view that triggered it.

**Example:**

```ts
// a view concern → the call site, not the factory
const { mutate } = useMutation(getSignInMutationOptions());
mutate(input, { onSuccess: () => router.back() });
```

**Guidelines:**

- MUST put operation-intrinsic effects — optimistic rollback, cache invalidation, error reporting that belongs to the write itself — in the factory's `onError`/`onSuccess`/`onSettled`.
- MUST put view effects — navigation, toasts, field resets — in the per-call callbacks passed at the `mutate(…)` / `useMutation` site, not baked into the factory.
- SHOULD leave a factory that only surfaces its error to the screen callback-free (no factory `onError`), letting the component's `error` state drive the UI.

## Invalidation

A write must evict the queries it made stale. The factory's branded key is what makes that eviction typed instead of a hand-written string array.

**Example:**

```ts
import { queryClient } from "~/core/helpers/query-client";
import { getCollectionListQueryOptions } from "~/collections/queries/collection-list-query";

export function getCollectionCreateMutationOptions() {
	return mutationOptions({
		mutationKey: ["collections", "create"],
		mutationFn: (input: CollectionInput) => createCollection(input),
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: getCollectionListQueryOptions().queryKey,
			});
		},
	});
}
```

**Guidelines:**

- MUST invalidate (or update) the queries a mutation's write affects in its success path, targeting `getXQueryOptions(input).queryKey` rather than a re-typed key array.
- MUST target the narrowest correct key scope; invalidation wiring and scope are enforced on review by the project's performance-and-reliability guidelines (caching-correctness).
- SHOULD prefer `invalidateQueries` for correctness, and reserve a `setQueryData` optimistic update for a latency-critical write — paired with a rollback in `onError`.
