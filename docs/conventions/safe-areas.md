# Safe Areas

The one mechanism this app reads safe-area insets through, which edges each screen is
responsible for, and how an inset composes with the design's own spacing.

Safe areas as a subject belong to two installed capabilities. Their rules are deferred
to rather than copied here — where one is named below it is because it binds to a
specific surface in this app, never as a second statement of the rule itself.
`react-component-styling`'s
[unistyles.md](../../.claude/skills/react-component-styling/references/unistyles.md)
owns the stylesheet mechanics — reading insets from the mini runtime, composing them as
a maximum, using the direction-agnostic properties. `expo-app-development`'s
[safe-areas.md](../../.claude/skills/expo-app-development/references/safe-areas.md) owns
the reasoning underneath — that an inset is a minimum clearance rather than a spacing
value, that a screen owns only the edges its chrome does not already cover, and what
enabling edge-to-edge rendering makes every screen responsible for. What follows is
this app's own answers within them: which mechanism, which edges, and what a device
this app cannot be tested on would show.

`app.json` enables `react-native-edge-to-edge`, so every screen here draws beneath the
system bars and every screen is responsible for its own clearance.

## Unistyles' mini runtime is the only inset source

Unistyles' mini runtime is the single source an inset is read from here, written as
`unistyles.md` prescribes. What this app adds is the exclusivity.

`react-native-safe-area-context` is installed, and it MUST NOT be imported. It is
declared in this app's `package.json` only because the navigator stack needs it
autolinked — the bundled bottom tab bar reads it to pad itself — not because this app
chose it as a mechanism, so removing the dependency is not the point and would break
the tab bar. A screen that called `useSafeAreaInsets` would not merely add an import;
it would leave the app with two inset conventions, and make the effective one whichever
library the navigator happens to bundle. For the same reason, no safe-area provider is
mounted anywhere in `src/app/`.

## Which edges each screen owns

A screen owns an edge when nothing else clears it. Both stack layouts set
`headerShown: true` (`src/app/(tabs)/collections/_layout.tsx`,
`src/app/(tabs)/settings/_layout.tsx`) and the tab group sets `headerShown: false`
(`src/app/(tabs)/_layout.tsx`), while the root navigator gives `sign-in` its own header
and leaves `welcome` with none (`src/auth/components/root-navigator/root-navigator.tsx`)
— so the header clears the top edge wherever there is
one and the Home tab is left owning its own. The tab bar clears the bottom edge on
every tab: expo-router's bundled `BottomTabBar` pads itself by `insets.bottom` and is
positioned in flow rather than over the content, so a tab screen that also padded its
bottom edge would double the clearance.

| Screen                      | Chrome                 | Edges it owns       |
| --------------------------- | ---------------------- | ------------------- |
| `welcome-screen`            | none                   | all four            |
| `sign-in-screen`            | stack header           | bottom + horizontal |
| `home-screen`               | tab bar, header hidden | top + horizontal    |
| `collections-screen`        | stack header + tab bar | horizontal          |
| `collection-records-screen` | stack header + tab bar | horizontal          |
| `collection-record-screen`  | stack header + tab bar | horizontal          |
| `settings-screen`           | stack header + tab bar | horizontal          |
| `licenses-screen`           | stack header + tab bar | horizontal          |

A screen MUST apply an inset only at an edge this table marks as its own, and a change
to a screen's chrome MUST be accompanied by a re-reading of this table — hiding a
header silently transfers an edge to the screen it uncovered.

One surface carries an inset on its callers' behalf, and it is deliberate.
`src/common/components/message-state/message-state.tsx` is rendered flush against the
screen's own edges at each of its call sites — `welcome-screen` renders it directly, and
`collections-message-state` wraps it for both Collections screens — so it carries the
horizontal pair once for all of them. It claims no fill of its own: each call site
supplies `flex: 1` through the `style` prop, and `welcome-screen` adds the vertical pair
it owns through that same prop, which comes last in the merged array and therefore wins.

That makes the array order load-bearing twice over, and a component test beside the file
holds it. A future call site MUST NOT rely on this component for the horizontal pair
unless it renders it flush against the screen edges, because the inset would otherwise
land somewhere other than the edge it is measured from.

Separately, each loading skeleton mirrors the inset of the surface it stands in for —
`collection-list-skeleton` matching `collections-screen`, `collection-records-skeleton`
matching `collection-records-screen`, and `collection-record-skeleton` matching
`collection-record-screen`'s field list — so the placeholder does not shift sideways
when the data arrives.

## An inset is floored against the surface's own gutter

`unistyles.md` owns the composition rule itself. What is this app's own is the second
argument — each surface floors its inset against the gutter it already had, so a device
reporting zero insets renders exactly as it did before this convention existed:

| Surface                                                     | Floors against       |
| ----------------------------------------------------------- | -------------------- |
| `message-state` (horizontal, for every call site)           | `theme.gap.lg`       |
| `welcome-screen` (vertical, via `MessageState`'s `style`)   | `theme.gap.lg`       |
| `sign-in-screen` content container                          | `theme.gap.md`       |
| `home-screen` root                                          | `theme.gap.lg`       |
| `collections-screen` + `collection-list-skeleton`           | `theme.gap.md`       |
| `collection-records-screen` + `collection-records-skeleton` | `theme.gap.md`       |
| `collection-record-screen` + `collection-record-skeleton`   | `theme.gap.md`       |
| `collection-records-header`                                 | `theme.gap.md`       |
| `collection-record-offline-notice`                          | `theme.gap.md`       |
| `licenses-screen` root                                      | `theme.gap.lg`       |
| `settings-screen` content container                         | nothing — see below  |

Two rows above are neither a screen nor a placeholder for one, and both are there for
the same reason: a band that spans the screen carries the horizontal pair itself rather
than inheriting the gutter of the list beside it.
`collection-record-offline-notice` is the band the record detail screen draws above its
fields while the device is offline. `collection-records-header` is the search section
fixed beneath the record feed's stack header — it meets the screen's edges rather than
sitting inside the cards' gutter, so it floors against the same value those cards use.
On that section the pair sits on the outer box that spans the screen, not on the
animated body inside it that shrinks as the feed is scrolled: the inset belongs to
whichever box actually reaches the edge.

A new surface takes the gutter it already had rather than inventing one, so adding
clearance never doubles as a redesign.

Where an inset applies to an edge, that edge's spacing MUST be written as a longhand
rather than folded into a `padding` or `margin` shorthand, even where the other edges
keep a plain gutter. This is a legibility rule, not a correctness one: in React Native
a longhand always wins over a shorthand for the same edge, whatever the declaration or
array order, so mixing the two leaves a reader working out which value applies. It also
keeps a single edge readable from a unit test, which is what the guards below assert.

`settings-screen`'s content container is the one exception: its horizontal value is the
bare `rt.insets.left` / `rt.insets.right`, because the gutter lives on its child rows
rather than on the container. It carries a comment saying so, and the collision with the
installed rule — along with what the exception costs — is recorded as a deviation in
[agent-skills.md](./agent-skills.md#settings-screens-content-container-carries-a-raw-inset).
Any future surface taking this exception MUST carry the same comment, naming the
children that hold the gutter, and MUST be recorded there too.

An inset-bearing surface MUST have a colocated unit test pinning what its owned edges
resolve to. Unistyles' jest mock reports zero insets, which makes the whole suite a
zero-inset device, so each floored surface asserts its design gutter and a surface that
replaced its `Math.max` with a raw inset fails its own test. `settings-screen` is
asserted the other way round — its horizontal pair is pinned at `0`, because the bare
inset above is a decision rather than an oversight, and flooring it would go unnoticed
otherwise.

Every surface in the table above carries one. `collection-record-offline-notice` was
the last to get one — it is neither a screen nor a placeholder for one, which is how it
arrived with no colocated test file at all — so the sentence above is now a statement of
fact about the tree as well as a rule.

Two limits of those guards are worth stating rather than discovering. **No unit test
here observes a non-zero inset at all**: the mock's insets are fixed at zero and
`StyleSheet.create` resolves once at module load, so what the suite holds is the gutter
fallback, never the clearance the change exists to produce — that is the manual
on-device pass. And each guard has to flatten an already-rendered style array itself,
because Unistyles' own `flatten` mock returns its argument untouched: most import
React Native's `StyleSheet` for that, against Unistyles' usual rule, while the four
component suites use the shared `resolveStyle` helper in `src/common/test-helpers/`.
That rule governs the stylesheet-declaration path, which none of these tests touch.

## A scrolling screen insets its content, not its container

Five screens scroll, and each carries its inset on the `contentContainerStyle` rather
than on the scroll container: `sign-in-screen`, `settings-screen`, and
`collection-record-screen` on their `ScrollView`, `collections-screen` and
`collection-records-screen` on their `FlatList`. None of the five scroll containers
carries padding; three are not styled at all (`sign-in-screen`, whose `flex` sits on
the enclosing `KeyboardAvoidingView`, and `collection-records-screen` and
`collection-record-screen`, whose backgrounds sit on a wrapping `View`), and the other
two hold background and `flex` only. `expo-app-development`'s
[safe-areas.md](../../.claude/skills/expo-app-development/references/safe-areas.md) owns
why.

## Horizontal insets are correctness, not observable behaviour

`app.json` pins `orientation` to `"portrait"`, so `rt.insets.left` and
`rt.insets.right` are zero on every device this app currently ships to. The horizontal
values above are therefore unverifiable by any manual check while that pin stands — no
landscape pass can exercise them.

They are written anyway, because an orientation unlock is the point at which they start
mattering and the point at which nothing would remind anyone to add them. A reviewer
MUST NOT read an untestable horizontal inset as dead code, and a change that unlocks
orientation SHOULD verify every surface in this document in landscape, which is the
first point at which a wrong-axis inset becomes visible.

One thing that unlock MUST re-derive rather than inherit is the pairing of a
mirroring property with a physical measurement, recorded as a known gap in
[agent-skills.md](./agent-skills.md#a-horizontal-inset-pairs-a-physical-measurement-with-a-mirroring-property).
It is unobservable while the portrait pin stands, and wrong under a landscape
right-to-left layout.
