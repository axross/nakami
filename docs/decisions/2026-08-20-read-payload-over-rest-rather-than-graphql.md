---
status: accepted
---

# Read Payload over REST rather than GraphQL

The app talks to whichever Payload server the person signing in names, at whatever
version and configuration that server happens to run. Its REST API answers with the
data and almost nothing about it: no display label for a collection, no title for a
record, no label or type for a field, and no flag marking the collections Payload
keeps for its own bookkeeping. The app works around each of those silences by deriving
a substitute, and Payload serves a second API beside the first — so whether GraphQL
answers any of them, and whether it can be relied on at all, was an open question that
would have been re-asked at every one of those workarounds.

REST was kept, and GraphQL was rejected. The comparison was measured on 2026-08-20
against the published `payload`, `@payloadcms/graphql`, and `@payloadcms/next`
packages at 3.88.0, the current release on that day, and against a live production
Payload deployment.

Availability was not the reason. GraphQL is enabled by default, served at
`/api/graphql` as a POST-only endpoint by a route the standard project template
generates, and it authenticates by the same token REST does. What rules it out is that
a GraphQL request has to name the fields it wants before it can ask for anything, and
every mechanism that would tell this app what to name is either absent or refused.
Schema introspection is what a client would ask, and Payload's
`graphQL.disableIntrospectionInProduction` defaults to `true` from 3.45.0 onward, so a
server running in production answers a query containing `__schema` or `__type` with an
error rather than a schema. The names of the operations themselves cannot be computed
either — each is derived from the collection slug through pluralization, and a
collection may override both the singular and the plural with anything it likes. Even
enumerating what exists is closed off: where REST answers with one access report
covering every collection at once, GraphQL's equivalent is a statically generated
field per collection, so reading it already requires knowing the collection names it
is being asked about.

What GraphQL would have bought, had it been reachable, is narrower than it looks. Its
schema publishes no collection label, no record title, no field label, and no hidden
flag, so four of the five silences above are exactly as silent there. Only a field's
type is genuinely knowable — and only by introspection, the one thing a production
server refuses.

Adopting it anyway would have cost two things beyond the work itself. A server can
switch GraphQL off wholesale, and a collection can opt out of it individually, so the
REST client would have to stay as the fallback and the app would carry two of them.
And a refused GraphQL operation commonly answers with HTTP 200, carrying the failure
in the response body instead — so the app's habit of reading the response status to
tell a rejected session, an unreachable server, and a refused write apart would have
to be rebuilt on the body.

What this constrains now is that every read and every write goes to the REST API, and
the derivations the app performs stay in place rather than waiting for a richer API to
retire them. A later proposal to adopt GraphQL overturns this record rather than
opening the question fresh, and two measurements are what would move it: Payload
publishing labels, titles, or field types outside introspection, or introspection
ceasing to be refused by default on a production server. Both were last measured at
3.88.0, and the introspection default has held since 3.45.0.
