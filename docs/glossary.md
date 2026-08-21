# Glossary

The words this project uses, and what each one means here. The first half is the
product's vocabulary, grouped by the spec that details each domain; the second
is the vocabulary of working on the repository, grouped by the document that
owns it. A term earns an entry when a newcomer would otherwise have to infer it,
and a word whose ordinary meaning is already exact is left out.

# Product vocabulary

## Authentication

**Payload server** — the Payload CMS instance this app is a client for,
identified by the `http` or `https` URL it is reached at. Every **session**,
**Collection**, and **record** the app shows belongs to one of them.

**auth collection** — the **Collection** on a **Payload server** whose
**records** are the accounts a sign-in is checked against, named by its **slug**
like any other **Collection**.

**session** — what the app holds while signed in to one **Payload server**:
which **auth collection** the account lives in, the token Payload issued for it,
that token's expiry, and the signed-in user's id and email.

**stored sign-in** — the email and password of a **session**, kept on the device
so the app can start a new session by itself once the **Payload server** ends
the current one. It exists only where the user allowed it at the dialog every
sign-in ends with, it is discarded when they sign out or the server refuses it,
and it is what makes a session outlast the server's own token lifetime. A
**session** without one ends when its token does.

## Collections

**Collection** — a named group of **records** on a **Payload server**, addressed
by its **slug**. It is Payload's own word for the grouping, and this app uses it
unchanged.

**record** — one entry in a **Collection**. Payload itself calls this a
*document*: its REST responses return `docs` and `totalDocs`, and its own
**system collections** are named for documents. This app says record instead —
in its code, in its UI, and here — and the two name the same thing. The glossary
records that divergence rather than settling it.

**field** — one named value a **record** carries. Which fields a record has is
its **Collection**'s own configuration on the **Payload server**, and this app
never sees that configuration: a record's JSON is the whole list, the server
returning every configured field and giving `null` for one that was never set.

**multi-line field** — a **field** whose value is a string containing a newline.
Payload's `textarea` and its `text` are the same `string` over the wire, so this
app infers the distinction from the value and nothing else: a newline in it, and
no other evidence. A field that is one is previewed rather than typed into on
the record screen, and is edited in the **field editor**. The same treatment
covers a field whose value is an array or object, which is edited as raw JSON —
that one is recognised by its type rather than by a newline.

**field editor** — the screen one **field** is edited in when its value does not
fit a line, opened from the preview standing where that field's input would be.
It is the one place in this app where an edit is committed deliberately, by a
Save, rather than by leaving an input.

**access** — a **Payload server**'s own verdict on what the signed-in account
may do with each **Collection**, answered per collection and per operation,
either as a plain yes or no or as a yes qualified by a condition. Where the
server restricts an individual **field**, the verdict reaches that far as well;
a denial at either level is the operation going unmentioned rather than being
answered no.

**slug** — the lowercase, hyphenated identifier a **Collection** is addressed
by, in Payload's REST paths and in this app's routes alike.

**system collection** — a **Collection** Payload creates and maintains for its
own bookkeeping — preferences, migrations, locked documents, jobs, folders —
rather than for the people using the CMS. Payload prefixes each one's **slug**
with `payload-`.

**derived title** — the name this app works out for a **record** from that
record's own fields, the **Payload server** giving none. A record carrying no
such field has no derived title, and reads as `Untitled` instead.

**derived label** — the display name this app works out for a **field** from
that field's Payload name, the **Payload server** publishing none. Separators
and camelCase boundaries alike read as word breaks, so `readingMinutes` reads as
`Reading Minutes`. A **Collection**'s own card name is derived the same way but
from a **slug**, which Payload guarantees lowercase and hyphenated and which
therefore needs no camelCase rule.

**Rich Text** — Payload's own **field** type for formatted content, whose value
is a document tree rather than a string. Nothing in a REST response says a field
is one, so this app recognises the tree by its shape, shows such a field as
holding Rich Text, and never writes to it.

**queued change** — an edit to one **field** of one **record** that has not
reached the **Payload server** yet. Changes wait in one queue and leave it
oldest first, and a second change to a field already waiting replaces it. The
queue is held in memory alone and belongs to the signed-in session, so whatever
is still waiting when the app closes or the session ends is lost.

**refused change** — a **queued change** the **Payload server** read and
declined. It leaves the queue and is not retried, and both the server's message
and the value it refused are kept: the message is what the row states, and the
value is what the row previews and the **field editor** reopens on, so a
refusal can be corrected rather than retyped. A change the server never gave a
verdict on — one that could not reach it, or one turned away before the value
was read — is not one of these and stays queued.

# Development vocabulary

## Directory Structure

**feature** — one product area's own directory under `src/` — `auth/`,
`collections/`, `home/`, `settings/` — holding the components, hooks, helpers,
models, queries, and stores that area needs. The repository uses the bare word
for the directory, not for the product capability the directory implements.

## Styling

**theme token** — a named value the app's theme hands to a component's styles: a
colour, addressed by role, tone, and step; a step on the spacing scale; or a
font family.
