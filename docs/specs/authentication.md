# Authentication

How the app reaches a Payload server and stays signed in to it. This domain
covers the signed-out landing, the sign-in form and what it validates, the
choice a successful sign-in stops to ask, the session the app keeps on the
device, how that session is verified at launch and kept alive while the app
runs, and signing out.

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

The email and password are offered to the device's password manager as one
credential — the email as the account name, the password as the password — so a
saved sign-in fills both in a single action. The Collection field is
deliberately kept out of that, rather than merely left unsaid, so that a slug
beside the credential pair is never mistaken for an account name.

The server URL is not offered, and no markup could offer it: the credential a
password manager hands back on either platform is an account name and a
password and nothing else, with no room for an endpoint. The keychain pre-fill
above is the whole of the answer for a returning user; where the keyboard can
offer URL suggestions of its own, the field is declared a URL field so that it
does, and where it cannot, the field is declared as offering nothing rather
than left unsaid.

No field on the form is left unsaid, in fact. A field that says nothing is
indistinguishable from one whose declaration was forgotten — and on one of the
two platforms silence is itself read as an instruction to skip the field — so
each of the four says either what it holds or that it holds nothing worth
offering.

The keyboard's return key moves through the form. On every field but the
password it reads Next and moves to the field below — from the server URL to
the Collection input while that field is being edited, and past it to the email
while it is still showing plain text and has no input to move to. The keyboard
stays up across the move. On the password it reads Go and submits, taking the
same path a press of the submit action takes, validation and all.

The submit action stays pressable whenever no sign-in is in flight — pressing it
is what validates the form, so a blank field is answered by a message naming it
rather than by a control that cannot be pressed. It is disabled only while a
sign-in is in flight, and then reads as working: a spinner beside a pending
label.

## What the form checks before asking the server

Submitting validates locally first, and a failure here is stated inline with no
request made:

- The server URL must be present and must be a well-formed `http` or `https`
  URL — a blank field and a malformed one are told apart. Surrounding whitespace
  and trailing slashes are stripped first, and it is the stripped value that is
  sent and remembered. Plain `http` is accepted, because a self-hosted Payload
  instance is often plain HTTP on a local network while it is being set up.
- The auth collection slug must not be empty once trimmed.
- The email must not be empty once trimmed; the password must not be empty, and
  is never trimmed.

Every field is checked on every press rather than only up to the first failure,
so one press says everything that is wrong. Each message renders beside the
field it concerns and carries an icon as well as its colour, so colour is never
the only cue. When more than one field is at fault the messages are preceded by
a count of them, which is itself a control and leads to the first field at
fault.

What a screen reader is told follows that same split: the count when more than
one field is at fault, and the message itself when only one is — announcing "1
problems to fix" would say less than the message does. A reader sent to a field
by the count is not left guessing either, because every flagged field carries
its own message in its name.

A field is also checked when focus leaves it, without waiting for a press. A
field already showing a message is re-checked as its value is edited, so the
message clears as soon as it stops being true; the other fields' messages are
untouched, and nothing already typed is lost by a failed submit.

## Signing in

A valid form posts the email and password to the auth collection's login
endpoint on the named server. They travel to no other host, and neither of them
is written to a log — a sign-in records the endpoint and the collection it was
attempted against, and nothing more.

A successful sign-in produces a session, but the app does not switch to the
signed-in tab UI yet: it stops at the question below first, and only the answer
to that commits the session. Once it does, the sign-in and welcome screens are
unmounted with the rest of the signed-out stack. The successful server URL is
also remembered on its own, separately from the session, and that is what the
next sign-in pre-fills from.

## Being asked whether to stay signed in

Every successful sign-in is followed by one question, asked in a dialog over the
sign-in form: may the app keep this sign-in on the device, so it can start a new
session by itself when the server ends this one?

The question is asked because the answer is the difference between a session
that lasts hours and one that lasts months, and it is asked rather than assumed
because what it keeps is a password. The dialog therefore says both things: that
a stored sign-in keeps the user signed in for months rather than hours, and that
a device someone gets past the lock of then yields the password itself rather
than a session that expires on its own. It also says that signing out removes
it, and that changing the answer means signing out and signing back in — there
is no switch anywhere else in the app.

Nothing dismisses the dialog but its two answers. There is no close control, a
tap outside it does nothing, and neither the Android back gesture nor an iOS
swipe closes it. Until one of the two is pressed the app is still signed out,
with the sign-in form behind the dialog holding everything that was typed.

Both answers are ordinary buttons of the same size, and neither is a faint link
under the other. Allowing it keeps the email and password that were just
accepted; declining keeps nothing beyond the session, which is exactly what the
app did before this question existed. The dialog's own text scrolls when it does
not fit, and the two answers stay put below it rather than scrolling away.

A keychain that refuses the write drops the dialog and states the failure on the
form, where a rejected sign-in is already stated. Backgrounding the app while
the dialog is up commits nothing: the next launch is signed out, and signing in
again asks again.

## The session

A session is the whole of what the app knows about being signed in: which
server, which auth collection, the token Payload issued, when that token
expires, and the signed-in user's id and email. It is held as a single entry in
the device keychain — never in the app's database or in plain key-value storage
— and holding one is what makes the app signed in.

The app holds one session at a time. Signing in to a different server, or as a
different user, replaces the previous session rather than adding to it.

A stored sign-in, where the question above was allowed, is a second keychain
entry of its own, holding the server, the collection, the email, and the
password — everything a fresh sign-in needs and nothing more. It is pinned to
the device it was written on, so it is left out of an encrypted device backup
and never restored onto another device. It never outlives the session it was
stored beside: a launch that finds no session discards it.

## Launch

At launch the native splash screen stays up until the auth state settles, so no
signed-in or signed-out surface is ever shown and then corrected.

The app reads the stored session and treats it as good while it re-checks it
against the server it belongs to. A server answering that the token is no longer
valid does not end things on its own — that is where a stored sign-in is used,
below. A server that cannot be reached changes nothing: the stored session
stays, and the app opens to its signed-in surfaces offline. A stored session
that cannot be read or parsed is discarded, and the app opens signed out.

## Keeping the token alive

While signed in, the app checks how much life the token has left as soon as it
is signed in, every time the app returns to the foreground, and on a five-minute
timer. A
token within thirty minutes of expiring — including one that expired already —
is exchanged for a fresh one, and the new token and expiry replace the stored
ones. A token with more life than that is left alone, so the check makes no
request until one is due.

A refresh that cannot reach the server changes nothing and is tried again at the
next check. A refresh the server rejects is the same event as a rejection at
launch, and takes the same path below.

## Signing back in without being asked

A token the server rejects — at launch, or at a refresh — is where a session
used to end. It now ends only for someone who declined to have their sign-in
kept.

With a stored sign-in, the app signs in again with it, on the spot and with
nothing shown: the new session replaces the old one and whatever the user was
doing continues. This is what makes a session last a month or more against a
server whose tokens last hours, and it is the only thing that can, because the
app can only renew a token while it is open and a server will not issue a
longer-lived one on request.

With no stored sign-in, the rejection signs the user out, exactly as it always
did.

A stored sign-in the server refuses — a changed password, a deactivated account
— is discarded there and then, and the user is signed out. It is never tried a
second time, so a stale password cannot lock the account out by being replayed.

A server that cannot be reached during any of this decides nothing: the session
and the stored sign-in both stay, and the next check tries again.

## Signing out

Sign out sits in the Account section of the Settings tab, beside the signed-in
email and the server the session belongs to. It ends the session on the server
where it can, and clears the local session either way — an unreachable server
does not keep someone signed in. A stored sign-in goes with it, which is what
makes signing out the way to take back the answer the dialog asked for. The app
returns to the welcome screen.

While a sign-out is in flight the row says so rather than only going quiet: it
takes a heavier fill, its icon becomes a spinner, and its label reads as
working.

Signing out deliberately leaves the remembered server URL behind, so the next
sign-in still pre-fills it.

## When a server rejects or cannot be reached

A failed sign-in keeps the person on the form with an inline message above the
submit action — the server's answer belongs to the form rather than to any one
field, which is why it sits apart from the field-level messages above it. The
message distinguishes three outcomes: the server rejected the credentials, the
server could not be reached at all, or the server answered with something
unexpected. A request left unanswered for fifteen seconds counts as unreachable.
Changing any field clears the message.

That same distinction runs through the whole domain, and it decides what happens
to a session rather than only what is displayed. A rejection is the server
saying the credentials or the token are invalid, and it signs the user out. An
unreachable server says nothing about validity, so it leaves the session where
it is.

## What authentication does not do

The app does not create accounts, does not reset or change a password, and does
not sign in through a third-party or single-sign-on provider. It carries no
setting for whether a sign-in is stored: the dialog after each sign-in is the
only place that is decided, and signing out is the only way to undo it. It also
does nothing at all while it is closed — no session is renewed in the
background, and nothing is scheduled to run while the app is not open. Signing in is an
email and a password checked against an auth collection that already exists on
the server; everything else about an account belongs to Payload's own admin UI.
