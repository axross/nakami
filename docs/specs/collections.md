# Collections

Browsing what is on the signed-in server, and editing one record's fields. This
domain covers the collections an account can read, the record feed inside one,
how that feed pages, the record a card opens and the fields it lists, how one of
those fields is edited and saved, and the loading, empty, and failure surfaces
all three screens show.

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
capitalised, so `blog-posts` reads as Blog Posts. Each row also carries an icon,
and the slug is the only signal for that too — the API reports nothing about
what a collection holds.

The slug is read as words and scanned from the last word backwards, so the
first word the app recognises decides the icon: `blog-posts` is marked as
documents, and `product-images` as images rather than products, because an
English name is about its last word. A word that fits two kinds equally is
recognised as neither, which is what lets `podcast-episodes` pass over
`episodes` and read as audio. A slug nothing recognises carries a plain box,
since a neutral mark beats a confident wrong one.

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
a metadata row holding the record's id in a small pill at the row's left and
when it was last updated at its right. Every card carries the pill, whether or
not the record has a title, so one feed reads as one shape. A card opens the
record it stands for.

Payload's REST responses carry no title for a record, so the title is derived
from the record's own fields: the first non-empty string among `title`, `name`,
`label`, `subject`, `heading`, `slug`, `filename`, and `email`, in that order.
Values that are not strings are skipped rather than coerced, so a numeric
`label` does not become a title. A record with none of those fields reads as
`Untitled` in its title row — in exactly the type a real title takes, and in the
muted ink of the metadata beneath it, so the absence reads as an absence rather
than as a second kind of title. Such a card announces the record's id to a
screen reader, the id being the only thing that identifies it.

An update within the last thirty days reads as how long ago it was: `Just now`
under a minute, then whole minutes, whole hours, `Yesterday` for the day before
that, whole days, and whole weeks. Anything older reads as a short date,
`18 Jul 2026`. How long ago is elapsed time rather than a count of calendar days
— `Yesterday` means twenty-four to forty-eight hours back — and the date is
formatted in UTC, so the same record reads the same on every device. Each label
is worked out as its card is drawn rather than as the page arrives, so a feed
returned to later reads as more time having passed. A record whose `updatedAt`
is missing or unreadable shows no label at all, and its id stays at the left of
the row.

## Paging through a collection

Records arrive a page at a time, twenty-five to a page. Scrolling near the end
of the feed loads the next page and appends it, with a spinner under the list
while that page is in flight, and paging stops at the last page the server
reports. The count in the header is the collection's total, not the number
loaded so far.

Pages are requested unpopulated: a relationship or upload field comes back as an
id rather than the record it points at, which keeps a page small regardless of
how connected the collection is.

## Opening a record

A card opens that record on a screen of its own, addressed by the collection's
slug and the record's id, so a link into it resolves to one record. The header
reads `Record` until the record arrives, and then carries that record's derived
title — or its id, where the record has no title-ish field, rather than the
`Untitled` its card in the feed shows.

Both values arrive as untrusted route parameters and are validated before use. A
link carrying no usable slug or record id identifies no record, so the screen
shows its load-failure state rather than an empty record, and offers nothing to
press — there is no record for a retry to load.

## The fields a record shows

The screen lists one row per key in the record's own JSON, in the order the
server returned them, with `id` first. That JSON is the whole field list: the
server answers with every field the collection configures, giving `null` for one
that was never set, so a field with no value is a row like any other rather than
an absence. The record is read unpopulated, as the feed's pages are, so a
relationship or upload field carries an id rather than the record it points at.

Every row shows the field's Payload name and a label derived from that name, in
every state a row can be in. Payload's REST API reports no label for a field any
more than it does for a collection, so the label is worked out from the name:
`-` and `_` separators and camelCase boundaries alike become word breaks, and
each word is capitalised, so `readingMinutes` reads as Reading Minutes and
`created_at` as Created At. A run of capitals stays whole, so `seoURL` reads as
Seo URL rather than Seo Url. This is a different derivation from a collection
row's name, which starts from a slug Payload guarantees lowercase and hyphenated
and so needs no rule about camelCase.

The label and the name share one line, the label at its start and the name at
its end, with the value beneath at the full width of the row. When the two do
not fit on that line, the name is what truncates: a shortened name still points
at the field, while a shortened label costs the reader what the field means. So
a row is the same height whatever its field is called.

## Editing a field

Which control a row carries follows the type of the value it holds, the REST API
reporting no field type either: a string takes a text input, a number a numeric
one, `true` or `false` a switch, and an array or object a raw-JSON editor a few
lines tall, opened on that value pretty-printed. Each opens on what the record
holds today.

A row is read-only for one of four reasons, and states which one — a disabled
control would say only that something is wrong, where these are four different
facts about the field. Where more than one is true, the row states the first of
them:

- **Server-assigned** — `id`, `createdAt`, and `updatedAt`. Payload maintains
  them itself, and that stays the reason even for an account that could not have
  updated them anyway.
- **No permission** — the server's access report grants the account no update on
  the collection, or none on that field; a collection or a field the report does
  not mention at all is read as a denial rather than assumed. This one is
  load-bearing rather than courteous: a write to a field the account may not
  update is not refused, it is accepted and dropped, so the app's own reading of
  that report is the only thing between the user and an edit that disappears
  silently.
- **Not editable here yet** — the value is a Rich Text document. This app can
  neither render nor edit one, and a field holding one is left exactly as it is.
- **No value** — the field is `null`. Nothing distinguishes an empty number
  field from an empty Rich Text one, so no control is offered rather than the
  wrong one.

A read-only row shows what value it does have where the control would be, with
the reason at the end of the same surface: `createdAt` and `updatedAt` read as
short dates the way a card's update label does, a Rich Text field reads as `Rich
Text` rather than as its markup, and a field holding `null` reads as an em dash.

## Saving a change

A text, numeric, or raw-JSON field saves when its input loses focus. A switch
saves the moment it is moved, there being no later point at which a switch is
finished with. A save carries the one field that changed and nothing else, which
is what keeps it from reverting another account's edit elsewhere in the record,
or clobbering a Rich Text field this app cannot even draw.

Leaving an input that was not changed sends nothing. Neither does one holding
text the app cannot read back into a value — an emptied or non-numeric numeric
input, or raw JSON that does not parse. The server takes a value of the wrong
type without complaint and stores `null` in its place, so a value the app cannot
read is held back rather than sent and quietly lost.

Every change goes through one queue rather than straight to the server, so a row
is marked as not saved yet from the moment the change is made until the server
has taken it. Changes leave that queue one at a time, oldest first, so two edits
in quick succession cannot overtake one another.

A change the server accepts is written into the record already on screen, and
nothing is re-read on its account: reloading would replace what is sitting in
every other input while it is still being typed in. A row takes its opening
value from the record once and holds what was typed from then on, so the record
going stale and loading again in the background leaves an input being edited
exactly as it was too.

## A refused save

A save the server refuses leaves the typed value in its input and states the
refusal beneath that row, in the server's own words where there are any: the
message Payload gave for that field when it named one, its summary of the
refusal otherwise, and a plain statement that the change was refused when the
response says nothing this app recognises. The server's own sentence is the only
version of a refusal anyone can act on, which is why it is preferred over
anything this app could compose. The row is marked as refused rather than as not
saved yet.

A refused change is not sent again by itself. Editing the field and leaving it
again clears the refusal and queues a fresh change.

## Editing with no connection

Editing goes on working with no connection, and the screen says so in a line
above the fields rather than by taking the fields away — there is nothing to
wait for and nothing to press. A change made offline waits in the same queue,
which empties itself in order once the connection returns.

A second change to a field already waiting replaces the first, so a field edited
over and over offline costs one save carrying the last value. A change that
could not be sent because the server was unreachable stays where it is and goes
with the next connection; only being accepted or being refused takes a change
out of the queue.

The queue is held in memory alone. It does not survive the app being closed:
whatever is still waiting then is lost, sent neither later nor at the next
launch.

## Loading, empty, and failure

While a first load is in flight, each screen shows a placeholder in the shape of
what is coming — rows in the collection list, cards in the record feed, field
rows on a record — laid out to the same geometry as the real thing, so nothing
shifts when the content arrives.
The placeholders pulse, and hold a steady opacity instead when the device asks
for reduced motion.

Opening any of the three with no connection, and with nothing loaded yet, states
that the device is offline instead of showing a placeholder: nothing is on its
way for a placeholder to stand in for. Each screen names what it is waiting
to load — collections, records, or the record itself — under a live line
saying it is waiting for a connection, which pulses and holds a steady
opacity under reduced motion the same way the placeholders do. There is
nothing to press: retrying gets no further while the device is offline, and
the screen loads by itself once the connection returns. A screen that already
has content keeps showing it rather than replacing it, so only a first load
reaches this state.

An account with no readable collections gets an empty state rather than an empty
list, and so does a collection holding no records. A record always carries at
least an id, so its field list has no empty state of its own.

All three map a load failure the same way, differing only in the noun:

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

The collection list, each record feed, and each record are scoped to the server
and the user they were loaded for. Signing in to another server, or as another
user, loads that account's collections and records rather than showing the
previous account's while the new ones arrive.

## What is still not possible

Nothing here creates or deletes. There is no compose screen and no delete
action, for a collection or for a record, so every record this app edits is one
something else made.

Editing reaches a field's own value and stops there. A field holding no value
cannot be given one, a Rich Text field cannot be written, and no field can be
added to or removed from a record — what fields a record has is its collection's
configuration, which lives on the server.

And there is no search, filter, or sort: the collection list's alphabetical
order and whatever order the server returns records in are the only orders there
are.
