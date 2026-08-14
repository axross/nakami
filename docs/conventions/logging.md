# Logging

Where this app's log lines go, and the shape a log call has to have.

Logging as a discipline belongs to the installed `software-instrumentation` capability
— which level a line deserves, deriving a module logger from the shared root, and never
putting a credential, a token, a raw request body, or PII into a log context. Two
things that capability deliberately leaves to the project are settled here, and a
reader who has just read it needs both, because its own guidance points the other way
on one and stops a step short on the other.

## The root logger and its transports

The root logger is created in `src/core/helpers/logging.ts` and runs at `debug`
severity in every build. Two transports read from it:

- a **console** transport that prints `info`, `warn`, and `error` in every build, and
  `debug` only in a development build;
- a **breadcrumb** transport that mirrors every line onto the error tracker's
  breadcrumb trail, so a later captured exception arrives with the lines that led up to
  it.

The severity gate is deliberately left open, and the console transport is what silences
verbose output in production instead. A gate set to `info` would drop `debug` lines
before the breadcrumb transport could see them, which is the opposite of what the trail
is for.

That second transport is also why the installed capability's rule against sensitive
values in a log context binds every line written here, including a `debug` line written
for a console nobody was watching: it leaves the device either way.

## The message shape

A log call MUST pass the message string first and at most one trailing context
object — `logger.info("Refreshed session token.", { expiresAt })`. A second
context argument MUST NOT be passed: the breadcrumb transport reads exactly the
first two arguments, so anything after them is dropped without a trace of having
been written.

This is the sentence that settles the argument order for this repository. The
installed capability hands the choice to the project explicitly ("some take
`(context, message)`, others `(message, context)`; keep it consistent
project-wide"), and every example it gives uses `(context, message)` — the
opposite of the order above. Writing a call that way is not a type error and not
a runtime error; the breadcrumb trail simply records `[object Object]` as the
message, with no data attached, and the console prints the pair the other way
round.

The message itself ends with a period. That much the installed capability already
requires of every project, and it is not restated as a rule here.

## Bracketing a failable operation

An operation that can fail MUST be bracketed by a `Started …` line before it and a
`Completed …` line after it. The installed capability recommends this; this repository
binds it, because the breadcrumb trail attached to a captured exception is often the
only record of what the app was doing on a device nobody can reach — and a start with
no completion is what distinguishes a request still hanging from one that failed
loudly.
