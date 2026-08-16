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

An inset MUST be read from Unistyles' mini runtime, inside the stylesheet that consumes
it — `StyleSheet.create((theme, rt) => …)`, then `rt.insets.top`, `.bottom`, `.left`,
`.right`. No inset travels through a provider, a hook, or a component's render.

`react-native-safe-area-context` is installed, and it MUST NOT be imported. It is a
private dependency of the navigator stack — the bundled bottom tab bar reads it to pad
itself — rather than a mechanism this app chose. A screen that called
`useSafeAreaInsets` would not merely add an import; it would leave the app with two
inset conventions, and make the effective one whichever library the navigator happens
to bundle. For the same reason, no safe-area provider is mounted anywhere in `src/app/`.

## Which edges each screen owns

A screen owns an edge when nothing else clears it. Both stack layouts set
`headerShown: true` (`src/app/(tabs)/collections/_layout.tsx`,
`src/app/(tabs)/settings/_layout.tsx`) and the tab group sets `headerShown: false`
(`src/app/(tabs)/_layout.tsx`), so the header clears the top edge wherever there is
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
| `settings-screen`           | stack header + tab bar | horizontal          |
| `licenses-screen`           | stack header + tab bar | horizontal          |

A screen MUST apply an inset only at an edge this table marks as its own, and a change
to a screen's chrome MUST be accompanied by a re-reading of this table — hiding a
header silently transfers an edge to the screen it uncovered.

Two surfaces carry an inset on another's behalf, and both are deliberate.
`src/common/components/message-state/message-state.tsx` is `flex: 1` and full-bleed at
each of its call sites — `welcome-screen` renders it directly, and
`collections-message-state` wraps it for both Collections screens — so it carries the
horizontal pair once for all of them; `welcome-screen` adds only the vertical pair it
owns, through that component's `style` prop. A future call site that does not render it
full-bleed MUST NOT rely on it for the horizontal pair, because the inset would then
land somewhere other than the screen edge. Each loading skeleton mirrors the inset of
the list it stands in for —
`collection-list-skeleton` matching `collections-screen`, `collection-records-skeleton`
matching `collection-records-screen` — so the placeholder does not shift sideways when
the data arrives.

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
| `licenses-screen` root                                      | `theme.gap.lg`       |
| `settings-screen` content container                         | nothing — see below  |

A new surface takes the gutter it already had rather than inventing one, so adding
clearance never doubles as a redesign.

Where an inset applies to an edge, that edge's spacing MUST be written as a longhand
rather than folded into a `padding` or `margin` shorthand, even where the other edges
keep a plain gutter. A shorthand and a longhand for the same edge resolve by order and
by which object each came from, and this app deliberately passes a Unistyles style
across a component boundary into `MessageState`'s `style` array — longhands on both
sides are what make the result readable rather than a question about resolution.

`settings-screen`'s content container is the one exception, and it carries a comment
saying so. Its horizontal value is the bare `rt.insets.left` / `rt.insets.right`,
because the container has no horizontal gutter of its own: the gutter lives on the
child rows, which each set `paddingHorizontal: theme.gap.md`
(`SettingMenuGroupBody`, `SettingMenuGroupHeading`, and the screen's two paragraphs).
Flooring the inset there would stack a second gutter on top of theirs. Any future
surface taking this exception MUST carry the same comment, naming the children that
hold the gutter.

Every inset-bearing surface has a colocated unit test pinning what its owned edges
resolve to. Unistyles' jest mock reports zero insets, which makes the whole suite a
zero-inset device, so each floored surface asserts its design gutter and a surface that
replaced its `Math.max` with a raw inset fails its own test. `settings-screen` is
asserted the other way round — its horizontal pair is pinned at `0`, because the bare
inset above is a decision rather than an oversight, and flooring it would go unnoticed
otherwise.

## A scrolling screen insets its content, not its container

Four screens scroll, and each carries its inset on the `contentContainerStyle` rather
than on the scroll container: `sign-in-screen` and `settings-screen` on their
`ScrollView`, `collections-screen` and `collection-records-screen` on their `FlatList`.
Their scroll containers hold background and `flex` only. `expo-app-development`'s
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

One thing that unlock has to re-derive rather than inherit: `paddingStart` / `paddingEnd`
mirror under a right-to-left layout, but `rt.insets.left` and `rt.insets.right` do not —
they are physical-edge measurements on both platforms. Pairing `paddingStart` with
`insets.left`, which is what `unistyles.md`'s own worked example prescribes and what
every surface here does, therefore applies the physically-left measurement to the
physically-right edge under RTL. In portrait both are zero, so the pairing is
unobservable today; in landscape RTL it would be wrong, and the fix belongs to whoever
unlocks orientation.
