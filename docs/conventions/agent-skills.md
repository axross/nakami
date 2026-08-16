# Agent Skills

Where this repository departs from an installed skill, and where an installed skill is
silent on, or wrong about, a case this repository hits. Nothing general lives here —
how a defect found in an installed skill gets resolved is the installed
`agent-skill-management` capability's rule, and the closing section below points at it
rather than repeating it.

Every entry is a recorded decision, not a defect. A reviewer who finds this codebase
doing one of the things below has found this document; anything else that departs from
an installed rule is a finding.

## Query keys carry no server URL

The installed `tanstack-query-development` capability's
[query-keys.md](../../.claude/skills/tanstack-query-development/references/query-keys.md)
states a MUST:

> MUST include every dimension of tenancy the deployment actually has — the account, and
> the server or region where those vary independently.

Both dimensions do vary independently here. A user signs in to whichever self-hosted
Payload server they name, and Payload's sequential ids make one id plausible on two
installs, so by that rule `serverUrl` belongs in the key. This repository instead treats
server and user as one authentication session and roots every session-scoped key at the
user id alone — [server-state.md](./server-state.md) states the rule.

What keeps that correct is an invariant outside the key. Every session end runs through
the auth store's `deauthenticate()`, which evicts the whole `["users", userId]` root,
and a cold start begins with an empty cache, so two servers' entries are never resident
at once. That invariant is the deviation's entire safety margin: a path that swapped
sessions **without** deauthenticating would let two installs sharing a user id collide
on one cache entry, and adding one means revisiting this entry rather than working
around it.

That capability's "the host project's existing convention wins" carve-out does **not**
sanction this. It preserves a question the surrounding codebase already answered,
whereas this convention arrived with the change that adopted it. The deviation is a
standing, accepted violation of that MUST — revisit it if the app ever holds more than
one session at a time.

## The Payload HTTP client sits in `src/common/`

`src/common/helpers/payload-client.ts` is this app's Payload HTTP client, and its
exported surface is Payload vocabulary end to end: `PayloadErrorKind`,
`PayloadRequestError`, `PayloadServer` — whose fields are a server URL and an auth
collection slug — `serverBaseUrl`, `request`, and `parseResponse`. On the strictest
reading of the content test in [directory-structure.md](./directory-structure.md), that
vocabulary puts it in `src/core/`, since a module carrying domain vocabulary goes there
whatever its consumer count. It stays in `src/common/` anyway. That is the maintainer's
decision, and what follows is what it rests on.

**It passes the content test's prose form.** *A `common/` module could be lifted into a
different application unchanged; a `core/` module could not, because it encodes this
one's configuration.* This module encodes no configuration of **this** application: the
server identity arrives as a `PayloadServer` parameter, the timeout is a transport
constant, and no host, credential, or setting appears in the file. It lifts into any
other Payload client unchanged. The theme was weighed against the same sentence and
failed it outright — the Radix palette, the two font families, and the `xs`/`sm`/`md`
breakpoints are this application — which is why it was folded into `src/unistyles.ts`
while the client stayed put. The two modules got different answers because the test
separates them, not because it was applied inconsistently.

**It is not the kind of module `src/core/` holds.** Every module there is a configured
singleton or a process-wide side effect: `env.ts` reads this app's environment,
`error-reporting.ts` initializes Sentry, `logging.ts` builds the root logger,
`query-client.ts` exports a constructed `QueryClient`, and `db/client.ts` opens the
database. `payload-client.ts` is none of those — it exports an error class and
stateless functions that take everything they act on as arguments, and nothing in the
app is wired from it. The word "clients" in that tier's list sits among the singletons
the application is configured with.

**The domain-vocabulary half is where a reviewer could reasonably land the other way.**
[glossary.md](../glossary.md) defines Collection, record, access, and session as
Payload's own words used unchanged, so "Payload vocabulary is not this app's domain
vocabulary" is not a free move. The reading taken here is that `PayloadRequestError`
and `PayloadServer` name the wire protocol the app speaks — as an `HttpError` would —
while the app's own model lives in `src/auth/models/` and `src/collections/models/`.
That is a judgment rather than something the rule forces, and this entry records it as
one.

The placement is settled, so it MUST NOT be raised as a fresh finding, and MUST NOT be
copied as precedent — a new cross-cutting module is placed by the content test, not by
this file.

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

## No text role carries a `fontWeight`

The installed `react-component-styling` capability requires a composite text role to
bundle four things:

> MUST declare typography as named text roles that bundle family, size, line height,
> and weight, and MUST apply a role whole rather than picking values out of it.
> — [theming.md](../../.claude/skills/react-component-styling/references/theming.md)

The six roles in `theme.typography.*` bundle three of them and deliberately omit
weight, which [styling.md](./styling.md) states as its own MUST NOT.

Weight here is carried by the font **file**, not by a style property. The three faces
bundled under `assets/fonts/` and registered in `app.json` are
`InnovatorGrotesk-Regular`, `InnovatorGrotesk-SemiBold`, and `JetBrainsMono-Regular`;
a role selects its weight by naming the file it wants. Setting `fontWeight` beside one
of those families does not select a weight — React Native synthesizes a second one on
top of the weight already in the file, which renders heavier than either face and
differs between iOS and Android. The rule assumes a variable or multi-weight family
registered under one name, which is the common web and React Native setup and is not
this app's.

The deviation would end, rather than be re-argued, if the app ever registers one family
name spanning several weights. Until then a role MUST NOT set `fontWeight`, and a unit
test in `src/unistyles.test.ts` holds it.

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

## `CollectionListItem` publishes no `style` prop

The installed `react-component-styling` capability requires `style` on every
mobile-native component that renders a styled root, and
`src/collections/components/collection-list-item/collection-list-item.tsx` renders one —
the `Pressable` inside `CollectionRow`. It accepts every other prop that root takes, and
omits `style` from its published type on purpose.

The cause is in the platform rather than in the component. `Link asChild` slots its
child through `@radix-ui/react-slot`, whose `mergeProps` composes a `style` by spreading
it into an object literal (`{ ...slotStyle, ...childStyle }`). Two things follow, and
both are silent in review: expo-router's own shim throws for the array form in
development and produces an index-keyed object from it in production, and a single
Unistyles style spread into a fresh object stops reacting to theme and runtime changes,
because Unistyles applies those through the reference it handed out. A `style` accepted
here would type-check and not work — the exact defect the props-and-spread contract in
issue #69 exists to remove, so publishing one to satisfy the rule would defeat the rule's
own purpose.

A row is therefore sized and placed from the list's `contentContainerStyle`. Any other
component this repository slots through `Link asChild` inherits the same constraint;
one that must take a `style` needs a different navigation shape — `onPress` with
`router.push`, as `WelcomeScreen`'s button already uses for an unrelated `Link asChild`
failure — rather than an exception here.

## A native-primitive root's props are based on `ComponentPropsWithRef`

The installed `react-component-development` capability's
[props.md](../../.claude/skills/react-component-development/references/props.md) names a
base type per kind of root in one sentence:

> MUST base the props type on the root rendered element: `ComponentProps<"div">` for an
> intrinsic web element, `ComponentPropsWithoutRef<typeof Primitive>` for a native
> primitive, and `ComponentProps<typeof Component>` when the component wraps another
> component.

Every props type in this repository built on a native primitive — a `View`, a `Text`, a
`Pressable` — uses `ComponentPropsWithRef<typeof Primitive>` instead. The same file's
Refs section is why:

> MUST let `ref` reach the root element on React 19 and later, where it is an ordinary
> prop: leave it in the rest object and let the spread carry it, or destructure it and
> pass it explicitly.

This app is on React 19.2.3, where `ref` **is** that ordinary prop — and
`ComponentPropsWithoutRef` is the helper whose whole job is removing it. A props type
built on it strips `ref` before any spread can carry it, so `<MessageState ref={r} …/>`
fails to compile with TS2322 and the caller is pushed into the wrapper node the Refs
section exists to prevent. For a native-primitive root the two rules cannot both be
followed literally: one names a base type, the other names an outcome that base type
makes unreachable. The with-ref form is the one taken, because it is the one that
satisfies the MUST — and it serves the base-type rule's own stated purpose, that every
attribute the root accepts passes through without being re-declared, rather than
defeating it.

Two things mark this as a live upstream contradiction rather than a stale pin. The
installed copy of `props.md` is byte-identical to `axross/skills`' `main`, verified when
the report was filed. And the same sentence's intrinsic-web branch already carries `ref`
on React 19, because `ComponentProps<"div">` does not strip it — only the
native-primitive branch collides with the Refs MUST, and that asymmetry is the evidence
the branch predates React 19 making `ref` an ordinary prop. It is filed upstream as
[axross/skills#405](https://github.com/axross/skills/issues/405); this entry stands until
that lands, and a props type based on `ComponentPropsWithoutRef` MUST NOT be reintroduced
in the meantime.

One component needs more than the substitution.
`src/settings/components/setting-menu-group/setting-menu-group-item-icon.tsx` renders a
caller-supplied Lucide icon, and `lucide-react-native` aliases `LucideIcon` as
`ForwardRefExoticComponent<LucideProps>` without the `RefAttributes` its concrete icon
exports carry — so `ComponentProps` and `ComponentPropsWithRef` resolve to the same
ref-less `LucideProps`. That part intersects `RefAttributes<SVGSVGElement>` on by hand,
`SVGSVGElement` being what those exports declare on native as well as on web. The cause
there is the vendor's type alias rather than the capability, and the file records it in
place.

## `settings-screen`'s content container carries a raw inset

Two installed capabilities forbid the raw inset outright:

> MUST combine an inset with the surface's own gutter as a maximum of the two,
> never using the raw inset as the padding.
> — [safe-areas.md](../../.claude/skills/expo-app-development/references/safe-areas.md)

> MUST combine a horizontal inset with the surface's own gutter as
> `Math.max(inset, gutter)`, so a device without an inset still gets the design's
> spacing.
> — [unistyles.md](../../.claude/skills/react-component-styling/references/unistyles.md)

`settings-screen`'s scrolled content sets `paddingStart: rt.insets.left` and
`paddingEnd: rt.insets.right` with no floor, which every other surface in
[safe-areas.md](./safe-areas.md) would write as a maximum. The rule assumes the surface
carrying the inset is also the one carrying the gutter. Here it is not: this container
has no horizontal gutter of its own, and each of its children sets
`paddingHorizontal: theme.gap.md` — `SettingMenuGroupBody`, `SettingMenuGroupHeading`,
and the screen's two paragraphs. Flooring the inset would stack a second gutter on top
of theirs, which is the outcome the rule exists to prevent, reached by following it.

The departure is not free, and the cost is the part worth knowing. Where every other
surface clears at `max(inset, gutter)`, a Settings row clears at `inset + gutter` — on
an edge reporting 44 that is 60 against 44 elsewhere. It is unobservable today, because
`app.json` pins `orientation` to `"portrait"` and the horizontal insets are zero, and it
would become visible on the first landscape pass.

The deviation ends, rather than being re-argued, the moment the horizontal gutter moves
onto the container itself or `Math.max` moves into those four parts — at which point the
rule applies unchanged. Until then the exception MUST stay a single surface, and any
future one MUST carry the comment naming the children that hold its gutter.

## A horizontal inset pairs a physical measurement with a mirroring property

The installed `react-component-styling` capability requires the direction-agnostic
properties for insets, and gives the reason:

> MUST apply insets with the direction-agnostic properties (`paddingStart` /
> `paddingEnd`), not `paddingLeft` / `paddingRight`, so a right-to-left layout mirrors
> correctly.
> — [unistyles.md](../../.claude/skills/react-component-styling/references/unistyles.md)

Its worked example pairs `paddingStart` with `rt.insets.left` and `paddingEnd` with
`rt.insets.right`. Half of that mirrors and half does not. `paddingStart` resolves to
the physically-right edge under a right-to-left layout, but `rt.insets.left` is a
physical-edge measurement on both platforms — iOS `UIEdgeInsets`, Android
`WindowInsetsCompat` — and does not swap with the writing direction. The pairing
therefore applies the physically-left measurement to the physically-right edge under
RTL, which is the opposite of the mirroring the rule promises. The reason given is
sound for the property and wrong for the value beside it; the rule is silent on how the
two compose.

**This repository follows the rule as written**, in every surface
[safe-areas.md](./safe-areas.md) lists. Two things make that the right call rather than
a concession. The values are structurally zero here — `app.json` pins `orientation` to
`"portrait"`, so `rt.insets.left` and `rt.insets.right` never differ from each other or
from zero on any device this app ships to — so the defect is unobservable. And
departing would mean inventing a pairing this repository could not test, in place of one
the capability prescribes.

The gap is recorded rather than fixed because the case that exercises it does not exist
yet. A change that unlocks orientation MUST re-derive the pairing rather than inherit
it, and that is the point at which raising it upstream on
[`axross/skills`](https://github.com/axross/skills) becomes worth the human's go-ahead.

## The e2e coverage gate counts a scenario covered on `declared`

The installed `end-to-end-testing` capability's
[scenario-coverage.md](../../.claude/skills/end-to-end-testing/references/scenario-coverage.md)
states a MUST:

> MUST count a scenario as covered only when a **passing** test carries its tag; a
> failing or skipped test leaves it uncovered.

`e2e/check-scenario-coverage.mjs` hands the core one result per flow with
`status: "declared"`, and `declared` is not passing. Every row this gate reports as
covered is therefore counted on something that rule does not accept.

The same reference is why it cannot do otherwise, in its closing section:

> SHOULD keep the gate fast and free of the system under test (pure file/report
> bookkeeping) so it can run anywhere, including where the app cannot be launched.

A gate that never launches the app has observed no execution, so it has no pass to
count — one static gate cannot satisfy both rules. This repository keeps the static
one, because that is what lets the `E2E Scenario Coverage` job run on a plain Ubuntu
runner with no simulator and catch a tag error on every pull request, and `declared`
is the honest word for what such a run saw. Reporting `passed` for a flow nobody ran
would satisfy the MUST by lying about the thing it exists to protect.
[end-to-end-testing.md](./end-to-end-testing.md) states the repository's answer in
full, including what a green gate does and does not prove.

The deviation ends, rather than being re-argued, the moment an adapter reads a real
Maestro report: the core already counts a scenario covered only when a result
carrying its tag neither failed nor was skipped, so true statuses satisfy that MUST
with no change to the join. Until that exists, `status: "declared"` MUST NOT be
raised as a fresh finding — and a green gate MUST NOT be reported as e2e
verification, which is that same capability's rule rather than a departure from it.

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
