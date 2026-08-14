# Server State

The one thing about this app's TanStack Query layer that its own wiring decides.

The installed `tanstack-query-development` capability owns the server-state layer in
full, and this repository follows it rather than restating it: the
`get<Name>QueryOptions` and `get<Name>MutationOptions` option factories that live under
each feature's `queries/` and `mutations/`, the tenancy-rooted query-key shape, cache
lifetime, invalidation, and reading a store through its non-reactive accessor inside the
query function rather than in the factory body. Two existing query keys predate that
shape; [agent-skills.md](./agent-skills.md) records them and the issue that migrates
them.

## One query client

The application constructs exactly one `QueryClient`, in
`src/core/helpers/query-client.ts`, and every consumer MUST import that instance rather
than build another. The installed capability states this as a SHOULD; this repository
binds it, because that module is where the app's retry and staleness baseline is set
and where a failed query is classified and reported to the error tracker. A second
client would opt whatever used it out of both, and would do so invisibly — the screen
still works, and only the errors stop arriving.

A unit test is the exception and MUST build its own throwaway client through
`createTestQueryClient` in `src/common/helpers/test-query-client.ts`, which disables
retries and gives each test a fresh cache, so cache state never leaks between tests.
