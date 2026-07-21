# Error Handling

Apply this reference when deciding how a query or mutation handles failure. The strategy gives each failure a single owner and keeps view concerns out of the factory. It is drawn from the two flows in the tree (sign-in, sign-out), not invented. Error **logging levels** and error-tracker **capture** stay owned by the project's observability guidelines; this reference owns only where an error is caught, surfaced, and mapped.

## Mutations: Tolerable vs. Propagated

A `mutationFn` catches only the failures it can resolve locally and lets everything else reject to the mutation's `error` state.

**Example:**

> Sign-out's remote `logout` is wrapped in `try`/`catch`: offline still signs out locally, so the failure is logged and swallowed. The local `deauthenticate()` is not wrapped — if it throws, the mutation should reject.

**Guidelines:**

- MUST catch inside the `mutationFn` only a failure the operation can tolerate and continue past (a best-effort remote call), log it through the project's structured logger, and proceed.
- MUST let every other failure reject, so it reaches the mutation's `error`/`isError` state and any `onError`.
- MUST place the `try`/`catch` at the `mutationFn` root, not in a nested helper, per the project's observability guidelines (error-handling rules).

## Mutations: Surfacing and Mapping

The factory surfaces the raw domain error; the component maps it to user-facing copy.

**Guidelines:**

- MUST surface the domain error unwrapped from the factory (e.g. a `PayloadRequestError`), so the component can narrow it with `instanceof`; do not translate it to a string inside the factory.
- MUST map a raw error to user copy at the presentation layer (a `messageForError` in the screen), keyed off the error type/kind — never in the factory.
- SHOULD rely on `TError` defaulting to `Error` in v5; a factory that surfaces a subclass keeps it assignable, so `instanceof` narrowing works at the call site.

## Queries: Throw, Then One Channel

TanStack Query v5 removed per-query `onError`/`onSuccess`/`onSettled`. A query throws, and exactly one channel handles the error — chosen deliberately, not defaulted.

**Guidelines:**

- MUST make a `queryFn` throw on failure (never return a sentinel), so the query enters its error state and the thrown error propagates.
- MUST NOT put an `onError` callback in a `queryOptions()` factory — v5 does not support it; use one of the channels below instead.
- MUST choose one query-error channel per query: the returned `error`/`isError` rendered inline (default for an inline error/retry surface), an error boundary via `throwOnError`, or the global `QueryCache({ onError })` on the shared client for cross-cutting reporting.
- SHOULD reserve the global `QueryCache` handler for genuinely cross-cutting concerns (centralized reporting/logging), not per-screen error copy.

## Retry and Ownership Boundaries

Retry and the log-versus-report split are deliberate choices, and two of them belong to neighboring skills.

**Guidelines:**

- SHOULD inherit the shared client's `retry` default (2) and override it per-query or per-mutation only for a fast-fail or non-idempotent operation.
- MUST defer log-level and error-tracker-capture decisions to the project's observability guidelines, and cache-invalidation-on-write correctness to the project's performance-and-reliability guidelines; this reference does not restate either.
