# E2E Scenario Catalog

The journey catalog for the Maestro e2e suite: one row per user journey the suite
should assert, joined to the flows by the dotted `Id`. Every asserting flow carries
`scenario:<id>` in its flow-config `tags:` list, beside `area:` and `priority:`
facet tags that have to agree with the row.

The coverage gate (`npm run test:e2e:coverage`, also the first step of
`npm run test:e2e`) reads the table below. It fails when a `must`-priority scenario
has no asserting flow, when a flow tags a scenario this table does not list, and
when a flow's facet tag disagrees with a row it tags; `should` / `may` gaps are
report-only. What that gate does and does not prove, and the Payload fixture an
authenticated flow needs, are in
[docs/conventions/end-to-end-testing.md](../docs/conventions/end-to-end-testing.md).

Add a row when a feature introduces a new user journey — in the same change as the
flow that asserts it, or with an honest priority if it is a known gap. Remove a row
only when the journey itself is removed from the product. Each journey's full
description is under [Journeys](#journeys) below, so a `Title` can stay short
without losing what a flow has to assert.

| Id                     | Title                                                                   | Area        | Priority |
| ---------------------- | ----------------------------------------------------------------------- | ----------- | -------- |
| `app.launch`           | Cold start reaches the welcome screen                                   | app         | must     |
| `auth.signed-out`      | Signed out, the welcome screen offers sign-in and shows no tab bar      | auth        | must     |
| `auth.sign-in-form`    | Blank fields are named on press, Collection toggles, an unreachable server errors | auth  | must     |
| `auth.session`         | Signing in mounts the tab UI, and Sign out returns to the welcome screen | auth       | should   |
| `auth.credential-consent` | Signing in stops to ask whether to keep the sign-in, and neither answer can be skipped | auth | should |
| `auth.silent-reauth`   | An expired token is replaced from a stored sign-in with no visible sign-out | auth     | should   |
| `auth.last-server-url` | Reopening sign-in pre-fills the last-used server URL                    | auth        | should   |
| `tabs.navigation`      | The bottom tabs reach Home, Collections, and Settings                   | tabs        | should   |
| `collections.list`     | The Collections tab lists the server's readable collections             | collections | should   |
| `collections.records`  | A collection's records load as a paging card feed                       | collections | should   |
| `collections.search`   | Typing in the record feed's search field narrows it to matching records  | collections | should   |
| `collections.offline`  | Losing the connection states it, and reconnecting loads on its own      | collections | should   |
| `collections.record`   | A card opens the record, listing every field it carries                 | collections | should   |
| `collections.record-edit` | Editing a field saves it on blur, and a refusal states why           | collections | should   |
| `collections.record-field-editor` | A long field opens in its own editor, saving or discarding deliberately | collections | should   |
| `collections.record-offline` | A change made offline is queued and sends itself on reconnect     | collections | should   |
| `settings.menu`        | The Settings menu shows About and pushes the Licenses screen            | settings    | should   |

## Journeys

Fourteen of the seventeen carry a gap note. Each names what it is waiting on in its
own terms, and eleven of the fourteen wait on the same thing: a session signed in
against a Payload fixture, which this suite does not have.
[docs/conventions/end-to-end-testing.md](../docs/conventions/end-to-end-testing.md)
states the contract such a fixture satisfies. Eight of those eleven are tracked by
[#135](https://github.com/axross/nakami/issues/135), which predates
[`auth.credential-consent`](#authcredential-consent),
[`collections.search`](#collectionssearch), and
[`collections.record-field-editor`](#collectionsrecord-field-editor); the first two
need nothing the other eight do not, and the third needs only that the runner can
answer a native alert, so all three belong with them rather than with the three
below.

The other three need something further on top of that fixture.
[`collections.offline`](#collectionsoffline) and
[`collections.record-offline`](#collectionsrecord-offline) need a device whose
connectivity can be cut mid-flow, and [`auth.silent-reauth`](#authsilent-reauth)
needs a fixture whose issued token can be made to expire or be revoked on demand.
None of the three is in that issue's scope. Nothing else covers any of these
journeys end-to-end in the meantime: the unit suite exercises their components in
isolation, which is not the same claim.

### `app.launch`

The app cold-starts and reaches the welcome screen (the signed-out landing).

### `auth.signed-out`

Signed out, the app shows the welcome screen with a Sign in call to action and no
tab bar.

### `auth.sign-in-form`

From the welcome screen, the sign-in screen opens with its fields, pressing Sign in
with the form blank names each missing field under a count of the problems, the
Collection value toggles to an editable input, and an unreachable server surfaces
an inline error.

### `auth.session`

After signing in and answering the dialog that follows it, the tab UI mounts — the
Home, Collections, and Settings tabs and the Settings Account section appear — and
Sign out returns to the welcome screen.

**Gap:** no automated flow asserts this. Signing in is the journey itself, so it
cannot be arranged around: it needs credentials that a Payload fixture accepts.

### `auth.credential-consent`

A successful sign-in stops on a dialog asking whether to keep the sign-in on the
device. The dialog states what keeping it buys and what it costs, offers two
answers of equal prominence, and closes to neither the Android back gesture nor a
tap outside it. Either answer reaches the tab UI; only one of them leaves a stored
sign-in behind, and signing out removes it.

**Gap:** no automated flow asserts this. The dialog only appears after a sign-in
the server accepted, so it needs the same Payload fixture the journeys above wait
on and nothing beyond it.

### `auth.silent-reauth`

Signed in with a stored sign-in, reopening the app after the server has ended the
session lands on the signed-in surfaces without passing through the welcome
screen. With no stored sign-in the same lapse signs the user out, and a stored
sign-in the server refuses signs them out once rather than being retried.

**Gap:** no automated flow asserts this, and a Payload fixture alone does not close
it. The journey is about a token the server no longer accepts, so it needs a
fixture whose issued token can be expired or revoked on demand — either a very
short `tokenExpiration` the flow can wait out, or a way to end the session
server-side mid-flow — on top of the signed-in session the other gaps here wait
on.

### `auth.last-server-url`

After a successful sign-in and sign-out, reopening the sign-in screen pre-fills the
Server URL field with the last-used endpoint.

**Gap:** no automated flow asserts this. The pre-filled value is what a previous
successful sign-in persisted, so the flow needs one to have happened against a
Payload fixture first — this is the one journey that must not start from a cleared
state.

### `tabs.navigation`

Signed in, switching bottom tabs reaches the Home, Collections, and Settings
screens.

**Gap:** no automated flow asserts this. The tab UI mounts only once authenticated,
so there is no tab bar to switch until a session against a Payload fixture exists.

### `collections.list`

Signed in, the Collections tab lists the server's readable, non-system collections,
and tapping one opens the collection's records list.

**Gap:** no automated flow asserts this. The list is derived from the server's own
access map, so what it should contain is whatever a Payload fixture is seeded with
— there is nothing to assert against without one.

### `collections.records`

Signed in, opening a collection lists its records as a scrollable card feed — each
record a derived title over a metadata line — with loading, empty, and
failure-aware error states, and scrolling to the end loads more.

**Gap:** no automated flow asserts this. Beyond a session, the paging half needs a
fixture collection holding more than one page of records, and the empty state needs
a second collection holding none.

### `collections.search`

Signed in on a collection's records, typing into the search field above the feed
narrows it to the records the server matched, the count beside the field reports
how many, typing a record's id finds that record, a query nothing matches states
so and offers to clear it, and clearing returns the whole feed.

**Gap:** no automated flow asserts this. What a query should match is whatever a
Payload fixture is seeded with, so beyond a session it needs a collection whose
records carry a title-ish field and enough of them that a search is narrower
than the feed.

### `collections.offline`

Signed in with no connection, opening the Collections tab or a collection states
that the device is offline, offers nothing to press, and loads on its own once the
connection returns.

**Gap:** no automated flow asserts this, and it is one of the two gaps a Payload
fixture alone does not close. The journey is about the connection rather than the
server, so it needs the run to cut and restore the device's connectivity mid-flow —
a control the suite does not have today — on top of the signed-in session the other
gaps here wait on.

### `collections.record`

Signed in, tapping a record card opens that record on a screen of its own: one row
per field in the record's JSON with `id` first, each row naming the Payload field
and the label derived from it, and carrying either a control matching the value's
type or a stated reason it cannot be edited.

**Gap:** no automated flow asserts this. What rows the screen draws is whatever a
Payload fixture's records happen to hold, so there is nothing to assert against
without one.

### `collections.record-edit`

Signed in on a record, changing a field and leaving its input saves that one
field, and the row stops being marked unsaved once the server takes it. A save the
server refuses keeps what was typed in the input and states the server's own
message beneath that row.

**Gap:** no automated flow asserts this. Beyond a session it needs a fixture record
holding a field the account may update, and — for the refusal half — a field whose
validation can be made to fail on demand.

### `collections.record-field-editor`

Signed in on a record, a field whose value does not fit a line shows a three-line
preview rather than an input, and tapping it opens that field's own editor over the
record. Editing the text and pressing Save marks the row unsaved and closes the
editor; pressing Cancel after editing asks whether to discard, and closing without
having edited anything asks nothing. Raw JSON that does not parse keeps the editor
open and states the problem rather than saving.

**Gap:** no automated flow asserts this. Beyond a session it needs a fixture record
carrying both a newline-bearing string field and an array or object field, and the
discard half needs the runner to answer a native alert. The sheet's own dismiss
gesture is the part least reachable from a flow, and it is also the part the unit
suite can say least about — what it holds is that the gesture is disabled while
there is an unsaved edit, not that the platform honours that.

### `collections.record-offline`

Signed in on a record with no connection, editing a field marks the row unsaved
instead of failing, editing the same field again replaces what is waiting, and
restoring the connection sends one change carrying the last value without anything
being pressed.

**Gap:** no automated flow asserts this, and like
[`collections.offline`](#collectionsoffline) a Payload fixture alone does not close
it. The journey is about the connection as much as about the server, so it needs
the run to cut and restore the device's connectivity mid-flow — a control the suite
does not have today — on top of the signed-in session.

### `settings.menu`

Signed in, the Settings menu shows the About group with technical details, and
License pushes the Licenses screen.

**Gap:** no automated flow asserts this. Settings is a tab, and the tab UI is
reachable only once a session against a Payload fixture exists.
