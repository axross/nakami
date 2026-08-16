# End-to-End Testing

What this repository's e2e suite catalogs, how a flow joins itself to that catalog,
what the coverage gate proves, and the Payload fixture an authenticated flow needs.

End-to-end testing as a discipline belongs to the installed `end-to-end-testing`
capability — the locator hierarchy, polling instead of sleeping, owning the system
under test in one place, and the scenario-coverage mechanism this repository adopts
whole. What follows is only this repository's own answers within it: its catalog
columns, its tag vocabulary, the shape its gate is built in, and a fixture contract
nothing outside this project could infer.

## The journey catalog

[`e2e/scenarios.md`](../../e2e/scenarios.md) is the coverage denominator. Its table
MUST carry the four columns the capability's own example ships — `Id`, `Title`,
`Area`, `Priority` — one row per user journey. The gate resolves those columns from
the header rather than by position, case-insensitively and in any order, and ignores
every other column, so a fifth may be added without touching the parser.

An `Id` MUST be the dotted form (`auth.last-server-url`), and its first segment MUST
be the row's `Area`, so the two never drift. A row MAY wrap its id in backticks; the
parser strips them.

`Priority` MUST be one of `must`, `should`, or `may`. The capability also allows a
`manual` entry for a journey that truly requires the external network, and no row
here uses it: no cataloged journey depends on a live third-party endpoint, and the
six that need a server at all need *a* Payload server, which a fixture supplies
deterministically. A journey nobody has automated yet SHOULD stay in the table with
an honest priority and a gap note rather than leave the table, which is what makes
the report show real gaps.

A `Title` SHOULD stay short, and each journey's full description — what a flow has
to assert, and what a missing flow is waiting on — MUST live under the table rather
than inside it, because two paragraphs of prose in a table cell make the source
unreadable for the reader who needs it most.

## The tag vocabulary

A flow declares what it asserts in its flow-config `tags:` list, above the first
`---`. Three tags are recognized:

| Tag                     | Means                                                             |
| ----------------------- | ------------------------------------------------------------------ |
| `scenario:<id>`         | This flow asserts that journey's outcome. A flow MAY carry several |
| `area:<area>`           | Facet, for filtered runs and grouped reporting                     |
| `priority:<must\|should\|may>` | Facet, likewise                                              |

A facet tag joins its row case-insensitively — `priority:Must` and a `Must` cell both
normalize to `must`, and `area:` the same way — so one spelling of a value is never
reported as disagreeing with another. A `scenario:` tag joins exactly instead: an `Id`
is already required to be lower-case, and the id is the contract.

Which tag belongs on which flow — tagging the flow that asserts a journey's
**outcome** rather than one that merely passes through it, carrying a facet only
where it holds for every scenario the flow tags, and moving every tag in the same
change as a rename — is the installed capability's
[scenario-coverage.md](../../.claude/skills/end-to-end-testing/references/scenario-coverage.md),
and is not restated here. One thing about it is local: where that capability asks for
facet consistency, this repository's gate **enforces** it, so a facet that disagrees
with a row the flow tags fails the run rather than being left for a reviewer to
notice.

## The gate, and what it does not prove

The gate is two files, split so the runner can be replaced without rewriting the
join:

- [`e2e/scenario-coverage.mjs`](../../e2e/scenario-coverage.mjs) — the
  runner-agnostic core. It knows nothing about Maestro or YAML: it parses the
  catalog, and joins it against a normalized `{ title, tags, status }[]`.
- [`e2e/check-scenario-coverage.mjs`](../../e2e/check-scenario-coverage.mjs) — the
  Maestro adapter and the CLI reporting, run by `npm run test:e2e:coverage` and as
  the first step of `npm run test:e2e`. It walks `e2e/flows/`, reads each flow's
  `name` and `tags:`, and hands the core one result per flow, titled
  `<name> (<path>)` so every finding names both the flow and the file to open.

The gate exits non-zero on a flow tagging an id the catalog does not list, on a
facet tag that disagrees with a row the flow tags, on a facet tag carried without a
`scenario:` tag — which leaves no row to check it against, so it asserts nothing and
cannot be trusted — on an empty or malformed catalog, and on any uncovered
`must`-priority row. It reports without failing on an uncovered `should` / `may`
row and on the covered/total count.

The adapter reports every flow with status `declared`, and that word is load-bearing.
The gate reads files and never launches the app — which is exactly what lets the
`E2E Scenario Coverage` job run on a plain Ubuntu runner with no simulator — so it
has observed no execution and MUST NOT claim one. A green gate therefore proves tag
bookkeeping and nothing else: that every tag joins to a row, that the facets agree,
and that no `must` row is unclaimed. Only a Maestro run proves a journey passes. The
core already counts a scenario covered only when a result carrying its tag neither
failed nor was skipped, so an adapter that later reads a real Maestro report supplies
true statuses without any change to the join.

Counting a row covered on `declared` departs from the capability's own "covered only
when a **passing** test carries its tag", which is why it is recorded as an accepted
deviation in [agent-skills.md](./agent-skills.md) rather than left to be found here.

## The Payload fixture contract

Six cataloged journeys need the app to be signed in, and signing in needs a Payload
server. That server is **bring-your-own**: no Payload instance, seed script,
container definition, or compose file lives in this repository, and no npm command
starts one. A developer running the authenticated flows points the variables below
at an instance they run themselves. That is a deliberate choice rather than an
omission — keeping a CMS, its database, and a seed script inside a mobile app's
repository is a second stack to maintain, for a suite that needs a simulator and so
cannot run in CI either way.

No flow reads these variables today. The six journeys are cataloged as gaps in
[`e2e/scenarios.md`](../../e2e/scenarios.md) and tracked by
[#135](https://github.com/axross/nakami/issues/135); the contract is written down
first so those flows are built against a settled shape rather than each inventing
one.

### The environment variables an authenticated run reads

| Variable                     | Holds                                                                                                        |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `NAKAMI_E2E_SERVER_URL`      | The fixture's base URL, as typed into the sign-in screen's Server URL field                                  |
| `NAKAMI_E2E_AUTH_COLLECTION` | The slug of the auth-enabled collection to sign in against. The form defaults to `users`; set this only when the fixture differs |
| `NAKAMI_E2E_EMAIL`           | The seeded user's email address                                                                              |
| `NAKAMI_E2E_PASSWORD`        | That user's password                                                                                         |

They are supplied to the run (`maestro test -e NAKAMI_E2E_SERVER_URL=… e2e/flows`)
and read inside a flow as `${NAKAMI_E2E_SERVER_URL}`. A fixture's credential, server
URL, or hostname MUST NOT be committed — not to a flow, not to `.env`, not as a
default in this document — and anything a run persists stays out of version control.

A deterministic literal that exists to drive a **failure** path is not a fixture
value, and that rule does not reach it.
[`e2e/flows/auth/sign-in-form.yaml`](../../e2e/flows/auth/sign-in-form.yaml) commits
`http://127.0.0.1:9`, `you@example.com`, and `wrong-password` on purpose — the
journey it asserts is an unreachable server, and the installed capability's
[test-environment.md](../../.claude/skills/end-to-end-testing/references/test-environment.md)
asks for exactly such an offline-safe input in place of a real endpoint. That flow
MUST NOT be raised as a violation of the paragraph above.

`NAKAMI_E2E_SERVER_URL` cannot have one value for both platforms. An iOS simulator
shares the host's loopback interface, so a server on the developer's machine is
`http://localhost:3000`; an Android emulator does not, and reaches the same host at
`http://10.0.2.2:3000`. The variable MUST therefore be set per run rather than baked
into a flow.

### The seed data a fixture must carry

A fixture MUST carry all three:

- **An auth-enabled collection holding the user the variables above name.** Every
  authenticated journey starts by signing in as that user, so nothing else works
  without it.
- **At least two readable, non-system collections.** The Collections tab lists what
  `GET /api/access` grants read on, minus Payload's own `payload-`-prefixed
  collections (see `toCollectionList` in `src/collections/models/collection.ts`). A
  fixture with one readable collection cannot tell a working list from a fluke, and
  a second one holding no records is what the records feed's empty state needs.
- **More than one page of records in at least one of them.** The records feed
  requests 25 per page (`RECORDS_PAGE_SIZE` in
  `src/collections/helpers/fetch-records.ts`), so asserting that scrolling to the
  end loads more needs at least 26 records in that collection.
