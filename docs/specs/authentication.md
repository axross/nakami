# Authentication

How the app reaches a Payload server and stays signed in to it. This domain
covers the signed-out landing, the sign-in form and what it validates, the
session the app keeps on the device, how that session is verified at launch and
kept alive while the app runs, and signing out.

## Signed out

The app is signed out until a session exists, and in that state it lands on a
welcome screen naming what the app connects to, with one Sign in action. There
is no tab bar: the tabs are mounted only once a session exists, rather than
shown with their contents gated.

Sign in pushes the sign-in form over the welcome screen, and those two are the
whole of the signed-out app — leaving the form lands back on the welcome
screen.

## The sign-in form

The form asks for four things: the server URL, the auth collection, the email,
and the password.

The Server URL field pre-fills with the endpoint of the last successful sign-in,
read from the device keychain as the screen mounts. Typing wins over that read:
a value already being typed when the read resolves is never overwritten. Before
any sign-in has succeeded, the field starts empty.

The Collection field starts at `users` — the slug most Payload installations
give their auth collection — and shows it as plain text beside an edit
affordance rather than as an input, so the common case takes no interaction.
Pressing the affordance replaces the text with a focused text field and a hint
naming what the value is.

Email and password are ordinary fields, the password masked. None of the four
fields auto-capitalises or auto-corrects.

The submit action stays disabled until the server URL, the email, and the
password are all non-empty, and reads as pending while a sign-in is in flight.

## What the form checks before asking the server

Submitting validates locally first, and a failure here is stated inline with no
request made:

- The server URL must be a well-formed `http` or `https` URL. Surrounding
  whitespace and trailing slashes are stripped first, and it is the stripped
  value that is sent and remembered. Plain `http` is accepted, because a
  self-hosted Payload instance is often plain HTTP on a local network while it
  is being set up.
- The auth collection slug must not be empty once trimmed.
- The email and the password must not be empty; the email is trimmed.

## Signing in

A valid form posts the email and password to the auth collection's login
endpoint on the named server. They travel to no other host, and neither of them
is written to a log — a sign-in records the endpoint and the collection it was
attempted against, and nothing more.

A successful sign-in produces a session, and the app switches to the signed-in
tab UI at once; the sign-in and welcome screens are unmounted with the rest of
the signed-out stack. The successful server URL is also remembered on its own,
separately from the session, and that is what the next sign-in pre-fills from.

## The session

A session is the whole of what the app knows about being signed in: which
server, which auth collection, the token Payload issued, when that token
expires, and the signed-in user's id and email. It is held as a single entry in
the device keychain — never in the app's database or in plain key-value storage
— and holding one is what makes the app signed in.

The app holds one session at a time. Signing in to a different server, or as a
different user, replaces the previous session rather than adding to it.

## Launch

At launch the native splash screen stays up until the auth state settles, so no
signed-in or signed-out surface is ever shown and then corrected.

The app reads the stored session and treats it as good while it re-checks it
against the server it belongs to. A server answering that the token is no longer
valid signs the user out. A server that cannot be reached does not: the stored
session stays, and the app opens to its signed-in surfaces offline. A stored
session that cannot be read or parsed is discarded, and the app opens signed
out.

## Keeping the token alive

While signed in, the app checks how much life the token has left as soon as it
is signed in, every time the app returns to the foreground, and on a five-minute
timer. A
token within thirty minutes of expiring — including one that expired already —
is exchanged for a fresh one, and the new token and expiry replace the stored
ones. A token with more life than that is left alone, so the check makes no
request until one is due.

A refresh the server rejects signs the user out. A refresh that cannot reach the
server changes nothing and is tried again at the next check.

## Signing out

Sign out sits in the Account section of the Settings tab, beside the signed-in
email and the server the session belongs to. It ends the session on the server
where it can, and clears the local session either way — an unreachable server
does not keep someone signed in. The app returns to the welcome screen.

Signing out deliberately leaves the remembered server URL behind, so the next
sign-in still pre-fills it.

## When a server rejects or cannot be reached

A failed sign-in keeps the person on the form with an inline message under the
fields, and the message distinguishes three outcomes: the server rejected the
credentials, the server could not be reached at all, or the server answered with
something unexpected. A request left unanswered for fifteen seconds counts as
unreachable. Changing any field clears the message.

That same distinction runs through the whole domain, and it decides what happens
to a session rather than only what is displayed. A rejection is the server
saying the credentials or the token are invalid, and it signs the user out. An
unreachable server says nothing about validity, so it leaves the session where
it is.

## What authentication does not do

The app does not create accounts, does not reset or change a password, and does
not sign in through a third-party or single-sign-on provider. Signing in is an
email and a password checked against an auth collection that already exists on
the server; everything else about an account belongs to Payload's own admin UI.
