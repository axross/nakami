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

## A test may read the app query client's cache configuration

The installed `tanstack-query-development` capability's
[testing.md](../../.claude/skills/tanstack-query-development/references/testing.md)
states a MUST:

> MUST construct a fresh client per test and never reuse the application's singleton,
> so cache state cannot leak between tests.

[server-state.md](./server-state.md) carried that rule unqualified and now scopes it to
a test that needs a working client. Such a test still MUST build a throwaway one
through `createTestQueryClient`, and no test may drive a query through the application's
instance or mutate what it holds. What the narrower rule permits is a read:
`src/core/helpers/query-client.test.ts` asserts that the app's cache is wired to
`reportQueryFailure` by reading `queryClient.getQueryCache().config.onError`, and
nothing else in that file reaches for the instance.

The difference rests on the reason both texts give for the rule — cache state must not
leak between tests. Reading one property of a cache's configuration creates no cache
state and shares none, so the leak the MUST prevents cannot happen through it. The
capability's wording is unqualified because it is written for the test it has in mind,
one that runs a query and asserts what comes back, and that test is bound here exactly
as it is upstream. The permitted assertion needs no client at all: the reporting
decision it checks was extracted into a plain function the other tests call directly,
which leaves the wiring itself as the one thing only the application's client can
answer for.

The installed copy is deliberately left alone. It is generated from
[`axross/skills`](https://github.com/axross/skills), so the next reinstall discards a
hand-edit while, until then, that edit reads as a rule the library agrees with. Whether
the gap generalizes enough to raise upstream is a separate decision needing the human's
go-ahead; this entry stands either way. Anything a test does to the application's
client beyond reading its cache configuration is a fresh finding rather than an
extension of this entry.

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

## The e2e coverage gate's own modules carry no unit test

The installed `unit-testing` capability's
[testing-scope.md](../../.claude/skills/unit-testing/references/testing-scope.md)
states a MUST:

> MUST add or update unit tests when a non-trivial pure helper, schema, parser,
> serializer, validator, or handler changes.

`e2e/scenario-coverage.mjs` holds a markdown table parser and the catalog-to-tag join,
and `e2e/check-scenario-coverage.mjs` hand-reads YAML block sequences, inline arrays,
quoting, and comments. All of it is exactly that shape, and none of it has a unit
test. The evidence carried instead is a manual mutation check, recorded in the pull
request that introduced the gate — real evidence, but run once by hand rather than on
every change.

**This one is a deferral, not a resolved collision.** The other entries above record a
rule this repository answers differently on purpose; this records a rule it means to
satisfy and has not yet. The distinction matters to whoever reads it next: there is
nothing here to argue with, only work that has not landed.

The reasoning that deferred it is Jest-specific, and only half of it survives.
`jest.config.cjs` matches `src/**/*.test.{ts,tsx}` only, so reaching these modules
through Jest means widening `testMatch` and taking on ESM-in-Jest configuration in a
file the [README](../../README.md) lists among those that fail globally — still true,
and still a reason not to use Jest here. It says nothing about `node --test`, which
reads these `.mjs` modules directly with no configuration at all; two specs written
against the shipped core pass in about 110ms. So the gap is narrower than it first
looked: the core is testable as it stands, while the adapter has to be refactored to
be importable without executing the gate, since its helpers are module-private and
loading the file runs the whole check and can call `process.exit(1)`.

[#139](https://github.com/axross/nakami/issues/139) carries that work, with the
mutation check's own cases as its test list. Until it lands, the absence of these
tests MUST NOT be raised as a fresh finding — and this entry MUST be removed by the
change that adds them, rather than left behind describing a gap that has closed.

## A form error reaches assistive technology by two substituted mechanisms

The installed `high-fidelity-ui-design` capability's
[interaction-states-and-feedback.md](../../.claude/skills/high-fidelity-ui-design/references/interaction-states-and-feedback.md)
names the web mechanism directly:

> MUST render each validation message inline beside its offending field, wire it via
> aria-describedby, and precede multi-error forms with a top summary that states the
> error count and links to the first field.

Two halves of that are unreachable in React Native, and the sign-in form substitutes a
mechanism for each. Both substitutions are deliberate, and the line numbers below are
from React Native 0.86's `node_modules/react-native/Libraries/Components/View/ViewAccessibility.d.ts`.

**There is no `aria-describedby`, and its nearest relative is Android-only.** The prop
does not exist in that file at all — no `describedby` under any casing. The association
props that do exist are `accessibilityLabelledBy` (line 227) and `aria-labelledby`
(line 235), and both carry `@platform android` in the comment immediately above them
(lines 225 and 233). Pairing a flagged input with its separate message node would
therefore leave VoiceOver reading nothing but "Email, text field" — which is exactly the
outcome the rule exists to prevent, reached by following it as literally as the platform
allows. `signInFieldLabel` in `src/auth/helpers/sign-in-form.ts` folds the message into
the input's own `accessibilityLabel` instead, so a flagged Email field is named "Email,
Enter your email address." on both platforms. The visible label and the visible message
stay separate nodes, so nothing about the sighted rendering changes.

**`accessibilityLiveRegion` is Android-only too**, at line 245, with `@platform android`
at line 240. It is what announces a message the user did not navigate to — the count
after a failed submit, a message raised by leaving a field, the server's rejection — and
on its own it would leave iOS silent for every one of them. The screen pairs it with
`AccessibilityInfo.announceForAccessibilityWithOptions(message, { queue: true })`,
guarded to `Platform.OS === "ios"`. The guard is what stops Android announcing twice, and
the queueing is what stops the utterance being clipped by the focus change that raised
it.

Folding the message into the name has one cost, and it is paid rather than left
implicit: on iOS the message would otherwise be read twice, once as part of the input's
name and again as the sibling message node. `SignInFieldError` therefore sets
`accessibilityElementsHidden` (line 291, `@platform ios`) on iOS only, which keeps
Android's live region — its sole channel — intact.

Both substitutions end, rather than being re-argued, if React Native gains a
cross-platform description association. Until then a flagged input MUST carry its
message in its accessible name, and a message surface MUST carry both the live region
and the iOS announcement rather than either alone.

## Three styles keep a boolean as a dynamic-function argument

The installed `react-component-styling` capability's
[unistyles.md](../../.claude/skills/react-component-styling/references/unistyles.md)
states a MUST:

> MUST express a closed set of options — a variant, an intent, a size, a boolean
> state — as variants and compound variants, not as a conditional style array or a
> chain of dynamic-function arguments.

Most of this repository follows it — `sign-in-text-field.tsx` is a component per
input precisely so each can select its own `flagged` variant, and a setting menu
row selects both its `position` and its `disabled` state. Three styles cannot, and
each is blocked by the same two facts about Unistyles 3.3.0 rather than by
preference.

**`useVariants` selects once per component body.** It is typed
`useVariants: (variants: ExtractVariantNames<T>) => void` on the stylesheet
(`node_modules/react-native-unistyles/src/types/stylesheet.ts:84`) and the rule's
own fourth clause requires it be called under the rules of hooks. A component
rendering several elements of one style with different values therefore cannot
express them, because it gets one selection for all of them.

**`pressed` is only readable inside the render prop.** React Native supplies it to
`Pressable`'s `style={({ pressed }) => …}` callback, which is not a component body,
so no hook may be called there. Unistyles ships its own `Pressable` with a
`variants` prop, but the native implementation destructures it and never uses it
(`node_modules/react-native-unistyles/src/components/native/Pressable.native.tsx:27`)
— it is a web-only affordance, and it takes a caller-supplied static record rather
than the live press state in any case. Expressing `pressed` as a variant would mean
lifting it into component state through `onPressIn`/`onPressOut`, which changes how
these components handle presses; that is a behaviour change, and it is not one this
rule asks for.

| Style | Argument | Why it stays |
| --- | --- | --- |
| `collection-list-item.tsx:106` `row` | `pressed` | `pressed` |
| `collections-message-state.tsx:63` `button` | `pressed` | `pressed` |
| `collection-list-skeleton.tsx:120` `row` | `divided` | rendered through `ROW_WIDTHS.map(…)`, so the value differs per row within one body |

`setting-menu-group-item.tsx` shows the third shape a `pressed` style can take and
is **not** a deviation: its `item` is a static style carrying `position` and
`disabled` variant groups, and the press feedback is a separate `itemPressed` style
the render prop selects from the array. Nothing there is a dynamic function, so the
rule's first clause is satisfied and only its own comment records why `pressed`
stays outside the variant groups.

Two neighbouring styles look similar and are **not** deviations:
`collection-records-skeleton.tsx:162` and `collection-list-skeleton.tsx:109` both
take a width, which the same rule's next clause requires stay a dynamic function.

The two `pressed` styles convert the moment Unistyles offers a press state a
component body can read, or its native `Pressable` honours the `variants` prop it
already accepts. The skeleton row converts when its rows become a component of
their own, which is worth doing for its own reasons rather than for this rule.

**One cost of following the rule is worth knowing before extending it.** The jest
mock strips `variants` and `compoundVariants` from every stylesheet and stubs
`useVariants` to a no-op (`node_modules/react-native-unistyles/src/mocks.ts:218-219`),
so a variant's values never reach the rendered tree under test. A converted style's
colours cannot be asserted at all; only the selection can, by spying on
`useVariants`. Converting a style therefore trades a test that checks what is drawn
for one that checks what was asked for.

## A screen's loading branch is selected from `isPending`, not `isLoading`

The installed `tanstack-query-development` capability's
[consuming-queries.md](../../.claude/skills/tanstack-query-development/references/consuming-queries.md)
states a MUST:

> MUST select the loading branch from `isLoading` and the empty branch from the
> resolved `data`, so neither becomes unreachable on a gated or offline query.

The same file states the reason twice more — once as "MUST read `isLoading` rather than
`isPending` for a first-load spinner wherever a query can be disabled or paused", and
once as a **Major** review check on "`isPending` driving a first-load spinner where the
query is gated or the app can be offline".

All three of this app's list and detail screens instead branch on `isPending` plus
`fetchStatus`, in this order:

| Screen | File |
| --- | --- |
| Collections list | `src/collections/components/collections-screen/collections-screen.tsx` |
| Record feed | `src/collections/components/collection-records-screen/collection-records-screen.tsx` |
| Record detail | `src/collections/components/collection-record-screen/collection-record-screen.tsx` |

```tsx
if (isPending && fetchStatus === "paused") {
  // the offline state
} else if (isPending) {
  // the skeleton
}
```

The empty-branch half of that MUST **is** followed: every one of the three selects it
from the resolved `data`. Only the loading half departs.

**The paused case is handled, and better than `isLoading` would handle it.** With no
connection a first fetch pauses rather than failing, so the query sits at `pending` with
`fetchStatus: "paused"` and nothing on its way. `isLoading` is `isPending && isFetching`,
so reading it would resolve the never-ending skeleton the rule is written to prevent —
by rendering nothing at all. These screens render a stated offline surface instead,
which is what
[`docs/specs/collections.md`](../specs/collections.md) promises and what the ordering of
the two branches above exists to produce. Following the rule literally would be a
regression here rather than a fix.

**The gated case is unreachable, and by a mechanism outside these files.** Each of the
three queries carries `enabled: session !== null`, so a disabled query would leave
`isPending` true with `fetchStatus: "idle"` and the skeleton pulsing forever. No path
reaches it: `src/auth/components/root-navigator/root-navigator.tsx` mounts the `(tabs)`
group behind `<Stack.Protected guard={status === "authenticated"}>`, and the auth store
sets `status: "authenticated"` only together with a non-null session. A signed-out app
does not have these screens mounted, so the gate never closes underneath one that is.

That invariant is the whole of what holds this exception up, and it lives two features
away from the screens it protects. **A change that mounts any of these screens outside
that guard — a tab group visible while signed out, a preview of a collection before
sign-in, a route reachable from the welcome stack — makes the unreachable branch
reachable, and the skeleton becomes permanent.** Such a change revisits this entry
rather than working around it: the fix is to select the skeleton from `isLoading` and
give the gated case a surface of its own, keeping the paused branch ahead of it.

Until then the three screens' branching MUST NOT be raised as a fresh finding, and a
fourth screen added to this pattern MUST be listed in the table above rather than left
for the next reader to find.

## The record-id lookup swallows a server-kind failure

`software-instrumentation`'s [error-handling rules](../../.claude/skills/software-instrumentation/references/error-handling.md)
state that a nested helper MUST NOT swallow an error silently, and that a caught error
representing an unexpected failure MUST be reported through `reportError`.
`src/collections/helpers/find-record-by-id.ts` departs from both for exactly one class
of failure, and the reason is that the class cannot be told apart from a normal answer.

That helper exists because a record's id is not a text field a `where` clause can match:
its type belongs to the server's database adapter, so the record search asks
`GET /api/{slug}/{id}` beside its field query and reads the answer as "the typed string
is one of this collection's ids, or it is not". The trouble is what "it is not" looks
like on the wire. Payload answers an unusable id as a 404 on some adapters and as a cast
failure — a 5xx — on others, which was
[confirmed against Payload's own issue tracker](https://github.com/payloadcms/payload/issues/13045)
rather than assumed. Both arrive as `PayloadRequestError`'s `"server"` kind, so the
status cannot separate them, and neither can the kind.

What the helper does with that:

- A `"network"` or `"auth"` failure says nothing about the typed string, so **both
  propagate**. The search around the lookup then fails the way its sibling field query
  would, and the reader gets the offline or the permission surface rather than
  `No matching records`. This half is not a deviation; it is the rule being followed.
- A `"server"` failure resolves to `null` — no match — and is **not** reported. This is
  the deviation.

Reporting it instead was considered and rejected: a reader typing an ordinary word into
the search field produces exactly this failure on a Mongo-backed collection, so
reporting it would send the error tracker one event per search that does not look like
an id. Propagating it was rejected for the same reason — it would turn every such search
into a failed screen.

What the deviation costs is real and worth naming: a genuine server fault on that one
endpoint reads as "no id match" and reaches no tracker. It is bounded — the field query
runs beside it and fails loudly on its own for any fault that is not specific to
`findByID` — except on a collection whose records carry none of the eight title-ish
fields, where the id lookup is the search's only request. A debug log keeps the case
visible to anyone reading a session's log.

This ends the moment Payload's REST API answers an unusable id with one status across
adapters, or exposes the distinction some other way. Until then, the helper MUST stay
this narrow: it exists for one speculative lookup, and widening what it is used for
would put this swallow under a call that needs the error.

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
