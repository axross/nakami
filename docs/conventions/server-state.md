# Server State

What this app's TanStack Query layer decides for itself.

The installed `tanstack-query-development` capability owns the server-state layer in
full, and this repository follows it rather than restating it: the
`get<Name>QueryOptions` and `get<Name>MutationOptions` option factories that live under
each feature's `queries/` and `mutations/`, the tenancy-rooted query-key shape, cache
lifetime, invalidation, and reading a store through its non-reactive accessor inside the
query function rather than in the factory body.

## One session root

Every session-scoped query key MUST be rooted at `getSessionQueryKeyRoot(userId)` from
`src/common/helpers/session-query-key.ts`, as in
`[...getSessionQueryKeyRoot(userId), "collections"]`, and MUST NOT retype the
`["users", userId]` literal that helper returns. The auth store's `deauthenticate()` hands the same helper's result to
`removeQueries`, and that is what a retyped prefix breaks: a literal that drifts from a
factory's root stops matching without failing anything, so the ended session's
collections and records stay readable in memory until `gcTime` expires them.

A session-scoped key that leaves the cache — into an error report, a log context, a
breadcrumb — MUST be described through `describeQueryKey` from that same module, and
MUST NOT be described by indexing into the key. It rebuilds the root through the factory
above with the user id replaced by `*` and joins what follows into a path, so a report
names the resource that failed and carries no user id. Indexing is the same drift a
retyped prefix is, in a different form: once every session-scoped key shared the
`["users", …]` root, `queryKey[0]` was the constant `"users"` for all of them, and
nothing failed — the report simply stopped telling one resource from another.

A query key MUST NOT carry the server URL. Server and user are one authentication
session here, so the user id identifies the tenant on its own, and a `queryFn` reads the
URL from the session alongside the token rather than taking it as a factory argument —
an argument the key omitted would be a result-changing input sitting outside cache
identity, which the installed capability forbids in the same breath. This knowingly
diverges from that capability's tenancy-dimension MUST and rests on the eviction above;
[agent-skills.md](./agent-skills.md) records the decision and the invariant holding it
up, and is the thing to read before relaxing either half.

## One query client

The application constructs exactly one `QueryClient`, in
`src/core/helpers/query-client.ts`, and every consumer MUST import that instance rather
than build another. The installed capability states this as a SHOULD; this repository
binds it, because that module is where the app's retry and staleness baseline is set
and where a failed query is classified and reported to the error tracker. A second
client would opt whatever used it out of both, and would do so invisibly — the screen
still works, and only the errors stop arriving.

A test that needs a working client is the exception and MUST build its own throwaway
one through `createTestQueryClient` in `src/common/helpers/test-query-client.ts`, which
disables retries and gives each test a fresh cache, so cache state never leaks between
tests. A test MAY read the application client's own cache configuration — as
`src/core/helpers/query-client.test.ts` reads `getQueryCache().config.onError` to
assert which function a failed query is reported through — and MUST NOT drive a query
through that instance or mutate anything it holds. The rule exists to keep one test's
cache state out of another's, and reading one configuration property creates no such
state and shares none; anything past a read needs a working client, which puts the test
back under the sentence above. This knowingly diverges from the installed capability's
unqualified "never reuse the application's singleton" MUST and rests on that read-only
limit; [agent-skills.md](./agent-skills.md) records the decision and the boundary
holding it up.
