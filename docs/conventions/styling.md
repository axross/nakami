# Styling

The theme tokens this app defines, what each family is for, and the breakpoint and
adaptive-theme settings registered alongside them.

Unistyles' own mechanics belong to the installed `react-component-styling` capability —
importing `StyleSheet` from the package, taking values from the `theme` argument,
keeping the light and dark maps structurally identical, choosing a colour by semantic
role rather than by resemblance. Design rationale — hierarchy, contrast targets, motion
taste — belongs to `high-fidelity-ui-design`. What follows is the token vocabulary
those capabilities are spent through, which only this repository defines.

`src/unistyles.ts` declares every token and the breakpoints, and registers them with
Unistyles — one file does both.

## Colours

A colour token is addressed as `theme.colors.<role>.<tone>.<step>`. The roles are
`foundation`, `surface`, `border`, `solid`, and `text`; each carries all three tones,
`neutral`, `accent`, and `destructive`. The step names differ per role:

| Role         | Steps                                                              |
| ------------ | -------------------------------------------------------------------- |
| `foundation` | `bare`, `subtle`                                                   |
| `surface`    | `base`, `highlight`                                                |
| `border`     | `subtle`, `base`, `intense`                                        |
| `solid`      | `base`, `intense` — the accent tone adds `baseAlpha`, `intenseAlpha` |
| `text`       | `base`, `intense`                                                  |

Within a role the steps run from least to most emphatic, which is what decides between
them: a secondary or muted label takes `theme.colors.text.<tone>.base` and the primary
one takes `intense` — Radix steps 11 and 12 respectively.

`theme.colors.text.onAccent` is the one flat token, with no tone or step: text drawn on
top of a solid accent fill. The scales mirror
[axross/cunnpe](https://github.com/axross/cunnpe) — Radix Slate for neutral, Teal for
accent, Ruby for destructive — and `text.onAccent` is the one field this app adds
beyond that structure, because cunnpe never draws text on a solid accent fill and this
app's filled buttons do.

A colour MUST come from a token. A shade the tokens do not already carry MUST be added
to `src/unistyles.ts` rather than inlined at the use site, so that the value has one
definition and the dark theme cannot silently miss it.

## Spacing

`theme.gap.*` is the spacing scale, and only the spacing scale: `xs` 8, `sm` 12, `md`
16, `lg` 24, `xl` 32. It covers padding, margin, and the gap between children. An
on-scale spacing value MUST NOT be hard-coded, and a radius MUST NOT be taken from it —
radius is its own family, below.

## Radii

`theme.radius.*` carries four steps, each named for the role a surface plays rather
than for its value, so a surface picks by role instead of by eye:

| Step   | Value | Role                                                              |
| ------ | ----- | ------------------------------------------------------------------- |
| `sm`   | 8     | Inset marks and placeholder bars — a collection row's icon tile, a skeleton bar |
| `md`   | 12    | The default surface corner — cards, inputs, buttons, menu-group ends |
| `lg`   | 16    | Large marks — a message state's icon plate                        |
| `pill` | 999   | Fully rounded — the record-id chip, the account avatar            |

A border radius MUST come from this family. `pill` needs no per-surface measurement:
React Native clamps a radius to half the shorter side, so one step draws a pill on a
short chip and a circle on a square avatar.

## Border widths

`theme.borderWidth.*` has two steps. `hairline` is `StyleSheet.hairlineWidth` — the
thinnest line the display can draw, a third of a point on a 3x screen — and is what
every border, divider, and flush-row separator in this app uses. `thin` is 1, the step
up for a border meant to read as a weight rather than as a separator; nothing consumes
it yet.

A border width MUST come from this family, and a hairline MUST NOT be written as the
literal `1`. That applies past `borderWidth` itself: a divider drawn as a filled `View`
takes its `height` from here, and rows sitting flush take the `rowGap` that separates
them from here too.

## Motion

`theme.duration.*` is `fast` 150, `base` 250, and `slow` 700 — named by magnitude
rather than by milliseconds, so retuning a step does not turn its name into a lie.
`slow` is the skeleton pulse; `fast` and `base` are the interaction tier and have no
consumer yet.

`theme.easing.standard` is the app's one curve, an ease-in-out quad. An animation MUST
draw its duration and its curve from these two rather than inlining either, including
when the value goes to reanimated rather than to a stylesheet — a component reads them
off the theme through `useUnistyles()` in that case.

Two things about `easing.standard` are worth knowing before changing it. It is written
out by hand rather than imported as reanimated's `Easing.inOut(Easing.quad)`, because
`src/unistyles.ts` is the root layout's first import and a `setupFiles` entry in
`jest.config.cjs` — importing `react-native-reanimated` there loads the real native
module, which fails every unit suite and pulls native initialization into the app's
first tick. And it carries the `"worklet"` directive, which is what lets reanimated run
it on the UI thread; `src/unistyles.test.ts` asserts that metadata survives being read
back off the registered theme, because no use site would catch its loss.

## Typography

`theme.typography.*` carries seven composite text roles, each bundling a font family, a
size, and a line height, and each named for the content it carries rather than for its
size:

| Role       | Family                      | Size / leading | Carries                                                            |
| ---------- | --------------------------- | -------------- | ------------------------------------------------------------------ |
| `display`  | `InnovatorGrotesk-SemiBold` | 28 / 34        | A screen's hero title — the Home landing                           |
| `title`    | `InnovatorGrotesk-SemiBold` | 20 / 26        | A centered message state's title                                   |
| `heading`  | `InnovatorGrotesk-SemiBold` | 16 / 22        | Button labels, card titles, section headings                       |
| `body`     | `InnovatorGrotesk-Regular`  | 16 / 22        | Running text, text inputs, list row labels                         |
| `caption`  | `InnovatorGrotesk-Regular`  | 13 / 18        | A form field's name, hints, errors, counts, metadata               |
| `code`     | `JetBrainsMono-Regular`     | 14 / 22        | Id chips, build details, read-only and raw-JSON field values        |
| `codeCaption` | `JetBrainsMono-Regular`  | 12 / 18        | Machine-readable text supporting something else — a record field's Payload name beside its label |

A text style MUST apply a role **whole** — `...theme.typography.body` — and MUST NOT
pick values out of one or override a part of it at the use site. A numeric `fontSize`
MUST NOT be inlined in a component: every size this app uses is a role, and a size with
no role is a missing role rather than an exception.

The three bundled families are module-private inside `src/unistyles.ts` and are
deliberately not reachable as a token. A family without its size is half a
typography decision, and exposing one invites a style to pick a family and then invent
a size — which is how the app came to have eight independently chosen sizes and one
line height in the first place.

No role sets `fontWeight`, and one MUST NOT be added. The bundled families encode
weight in the file itself (`InnovatorGrotesk-SemiBold` against `-Regular`), so pairing
an explicit weight with one makes React Native synthesize a second weight on top of the
real one.

`heading`, `body`, and `code` share a 22pt line box, which is what makes a record
card's height deterministic: `RECORD_CARD_LINE` in
`src/collections/components/collection-record-card/collection-record-card.tsx` is a
geometry constant sizing elements to that same 22, and no text style sets it.

`caption` and `codeCaption` share an 18pt line box for the same kind of reason: a
record field row sets its label in one and its Payload field name in the other, and
the two read as a single line only because that shared line box puts them on one
baseline. `codeCaption` exists rather than being inlined because a size with no role
is a missing role, and no monospace role below `code`'s 14 existed.

## Breakpoints

The registered breakpoints are `xs` 0, `sm` 380, and `md` 768, exported as
`breakpoints` from `src/unistyles.ts`. A responsive style value is written against
these names — the installed `react-component-styling` capability already requires
responsive values to be written against the project's declared breakpoints, and these
are they.

## Adaptive themes

`src/unistyles.ts` sets `adaptiveThemes: true`. The theme therefore follows the OS
colour scheme, and the app offers no in-app toggle: nothing in the product chooses a
theme. The consequence worth remembering is that a scheme switch swaps the theme object
underneath a screen that is already mounted, so a surface has to be correct in both
schemes at any moment, not only at the moment it was opened.

## The high-fidelity design kit

`.claude/assets/hifi-design-kit.html` is a self-contained, theme-aware HTML template
that renders this app's components and screens with the real tokens above, in light and
dark. It is for the high-fidelity round of a design exhibit — the round where concrete
colour, type, and spacing are the subject — after the layout has been settled with the
wireframe kit that ships inside the installed `wireframe-design` capability.

A static HTML file cannot import the TypeScript, so the kit's token block is a
hand-maintained mirror that drifts silently. `src/unistyles.ts` MUST be re-read before
each high-fidelity round and any drift reconciled into the kit, and the kit MUST stay
self-contained — no external fetches, system fonts and inline SVG only — because it is
opened straight from disk with no server behind it.
