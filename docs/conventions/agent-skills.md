# Agent Skills

Where this repository departs from an installed skill, and where an installed skill is
silent on, or wrong about, a case this repository hits. Nothing general lives here —
how a defect found in an installed skill gets resolved is the installed
`agent-skill-management` capability's rule, and the closing section below points at it
rather than repeating it.

Every entry is a recorded decision, not a defect. A reviewer who finds this codebase
doing one of the things below has found this document; anything else that departs from
an installed rule is a finding.

## Two query keys use the trailing-filter shape

`src/collections/queries/collection-list-query.ts` and `collection-records-query.ts`
put tenancy in a trailing filter object — `["collections", scope]` — which the
installed `tanstack-query-development` capability marks as a Major finding. Migrating
them is tracked as issue #67.

New code MUST use the tenancy-rooted key shape that capability states, and MUST NOT
take these two as precedent. Their migration SHOULD be left to issue #67 rather than
folded into an unrelated change, because changing a key invalidates whatever was cached
under the old one and is worth reviewing on its own.

## The Payload HTTP client sits in `src/common/`

`src/common/helpers/payload-client.ts` is this app's Payload HTTP client, and its
exported surface is Payload vocabulary end to end: `PayloadErrorKind`,
`PayloadRequestError`, `PayloadServer` — whose fields are a server URL and an auth
collection slug — `serverBaseUrl`, and `request`. Under the content test in
[directory-structure.md](./directory-structure.md) it belongs in `src/core/`, since a
module carrying domain vocabulary goes there whatever its consumer count. Only that
half of the test is breached: the server identity is caller-supplied, so the module
carries no application configuration.

It is in `src/common/` because this repository's placement rule used to decide by
consumer count, and three consumers had earned it a place there. That rule is gone, but
the file has not moved: relocating it touches every importing module and is the whole
content of issue #89, which also removes the upward import from
`src/core/helpers/query-client.ts` that the client's current placement forces.

Its placement MUST NOT be raised as a fresh finding, and MUST NOT be copied as
precedent — a new cross-cutting module is placed by the content test, not by this file.

## Five decision records were backfilled

The change that created this documentation tree also wrote five decision records for
choices already made. The installed `living-project-documentation` capability's
`bootstrapping.md` states "MUST NOT backfill decision records for choices already
made", on the grounds that reconstructed rationale is a guess presented as history. The
maintainer decided to write them anyway. What they rest on is split, and the split is
the honest part of this entry:

- The rationale for pinning React Native Testing Library to v13, and for each of the
  two Jest module mappers, is written out in full in `jest.config.cjs` and in the
  headers of the mock files under `jest/`. Those three records relocate rationale
  rather than reconstruct it — and by exactly the same token they fail that
  capability's own existence condition, which owes a record only where the rationale
  **cannot** be recovered from the code.
- The rationale for running e2e flows on Maestro, and for Drizzle over `expo-sqlite`,
  is recorded nowhere — not in the git history, not in the issue tracker. Those two
  records state the context, the choice, and the consequences from repository evidence,
  and say plainly that no rejected alternative is recorded anywhere.

A reader weighing one of the five against a change that would overturn it should weigh
it accordingly: three of them are a copy of a comment that is still in the code, and
two of them are a reconstruction with no rejected alternative behind it.

## The app has no error boundary of its own beneath the Sentry wrap

The installed `expo-app-development` capability requires an application-owned error
boundary **in addition to** the error tracker's root wrapper: the wrapper reports a
crash, and the boundary is what renders something other than a blank screen once it
has. This repository has only the wrapper — `src/app/_layout.tsx` exports
`wrapRootComponent(RootLayout)` and nothing beneath it catches a render failure.

That gap is issue #91's, and it is recorded here rather than fixed in passing because
the correct rule is contested and #91 is where it is being settled. Until it lands, a
reviewer who finds no application error boundary has found a known gap rather than a
fresh finding, and a route that needs custom error UI still adds its own boundary.

The rule this replaced said the opposite — that keeping the root wrapper intact was
itself sufficient. It was wrong as written and was deliberately not carried into
`docs/`.

## Screen bodies in `components/` are not a deviation

Routes here compose from `src/<feature>/components/`, and this repository has no
`screens/` directory. That is not a departure from any installed rule, and the absence
of a `screens/` directory MUST NOT be raised as a skill violation.

The installed `expo-app-development` capability's route-modules reference binds the
screen body to "the owning domain's screen directory rather than in the route file",
and marks the `screens/` name as conventional in the same sentence that introduces it.
The force of that MUST is route-file-versus-domain-directory, and this repository
satisfies it: `src/app/welcome.tsx` is a default export that mounts `WelcomeScreen`
from `~/auth/components/welcome-screen/welcome-screen`, with nothing but mounting in
the route file.

This entry exists because the directory name looks like a violation at a glance, and a
finding raised anyway costs a review round to answer.

## Recording a new deviation or gap

A **deviation** is a collision: an installed capability requires one thing and this
repository does another. A **gap** is an installed capability being wrong, outdated, or
simply silent on a case this repository hits. Both are recorded in this document — the
rule, the capability it departs from, and why the departure was accepted — rather than
left for the next agent to rediscover. An unrecorded deviation reads to that agent, and
to the CI reviewer, as a plain violation of a MUST; an unrecorded gap gets worked out
again from scratch by whoever hits it next.

Resolving the defect itself is a separate question, and the installed
`agent-skill-management` capability owns it in full — including which route a given
defect takes and what a public write on a repository this project does not own needs
first. Read it there rather than inferring a rule from the entries above.
