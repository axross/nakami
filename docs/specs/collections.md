# Collections

Browsing what is on the signed-in server. This domain covers the collections an
account can read, the record feed inside one, how that feed pages, and the
loading, empty, and failure surfaces both of them show.

Everything here needs a session, and each request carries that session's token —
[authentication.md](./authentication.md) owns how a session comes to exist, when
it is refreshed, and when it ends. Without one, none of these screens is
reachable at all.

## The Collections tab

The Collections tab lists the collections the signed-in account can read on its
server, one row each, ordered alphabetically by name.

What is listed comes from the server's own access report for that account, which
answers per collection and per operation. A collection is listed when the report
grants read on it; one it does not grant read on is simply absent, rather than
shown locked. Payload's own system collections are excluded on top of that, even
where the account can read them; the REST API does not expose the flag Payload's
admin UI hides them by, so their slug prefix is what identifies them.

Payload's REST API reports no display label for a collection, so a row's name is
derived from the slug: `-` and `_` separators become spaces and each word is
capitalised, so `blog-posts` reads as Blog Posts. Each row also carries a
monogram of that name's first letter.

## Opening a collection

A row opens that collection's records, titled with the same derived name the row
carried. The screen is addressed by the collection's slug, so a link into it
resolves to one collection.

The slug arrives as an untrusted route parameter and is validated before use. A
link carrying no usable slug identifies no collection, so the screen shows its
load-failure state rather than an empty collection.

## The record feed

A collection's records are a scrollable feed of cards, headed by the number of
records the server reports the collection holds. Each card carries a title over
a metadata row of the record's id and when it was last updated. A card is a
summary and is not interactive.

Payload's REST responses carry no title for a record, so the title is derived
from the record's own fields: the first non-empty string among `title`, `name`,
`label`, `subject`, `heading`, `slug`, `filename`, and `email`, in that order.
Values that are not strings are skipped rather than coerced, so a numeric
`label` does not become a title. A record with none of those fields shows its id
as the title instead, styled distinctly to mark it as a fallback, and its
metadata row then omits the id so it is never shown twice.

The last-updated line reads as a short date and is formatted in UTC, so the same
record reads the same on every device. A record whose `updatedAt` is missing or
unreadable shows no such line.

## Paging through a collection

Records arrive a page at a time, twenty-five to a page. Scrolling near the end
of the feed loads the next page and appends it, with a spinner under the list
while that page is in flight, and paging stops at the last page the server
reports. The count in the header is the collection's total, not the number
loaded so far.

Pages are requested unpopulated: a relationship or upload field comes back as an
id rather than the record it points at, which keeps a page small regardless of
how connected the collection is.

## Loading, empty, and failure

While a first page loads, both screens show a placeholder in the shape of what
is coming — rows in the collection list, cards in the record feed — laid out to
the same geometry as the real thing, so nothing shifts when the content arrives.
The placeholders pulse, and hold a steady opacity instead when the device asks
for reduced motion.

Opening either screen with no connection, and with nothing loaded yet, states
that the device is offline instead of showing a placeholder: nothing is on its
way for a placeholder to stand in for. Each screen names what it is waiting
to load — collections on one, records on the other — under a live line
saying it is waiting for a connection, which pulses and holds a steady
opacity under reduced motion the same way the placeholders do. There is
nothing to press: retrying gets no further while the device is offline, and
the screen loads by itself once the connection returns. A screen that already
has content keeps showing it rather than replacing it, so only a first load
reaches this state.

An account with no readable collections gets an empty state rather than an empty
list, and so does a collection holding no records.

Both screens map a load failure the same way, differing only in the noun:

- A refusal on permission grounds is an ordinary account or configuration state
  rather than a fault, so it is stated calmly and offers no retry — retrying
  cannot grant access.
- A server that could not be reached, and any other unexpected response, are
  stated as failures and offer a Try again action that reloads.

A failure that came from the device having no connection clears itself. Once
the device is back online, what failed is loaded again without Try again being
pressed, and the screen goes from the failure straight to the content. Try
again stays the route out of the other unexpected responses, which regaining a
connection does nothing about.

What is already on screen goes stale a short while after it arrives, and a
stale screen loads again when the app returns to the foreground. A feed left
open across a long absence is therefore current by the time it is looked at
again, rather than showing what the server held when the app was last put
down.

## Switching server or account

The collection list and each record feed are scoped to the server and the user
they were loaded for. Signing in to another server, or as another user, loads
that account's collections and records rather than showing the previous
account's while the new ones arrive.

## What browsing does not do

Browsing is read-only. Nothing here creates, edits, or deletes: there is no
compose screen, no field editor, and no delete action. There is no single-record
view either — a card does not open, so a record's remaining fields are not
reachable from the app. And there is no search, filter, or sort: the collection
list's alphabetical order and whatever order the server returns records in are
the only orders there are.
