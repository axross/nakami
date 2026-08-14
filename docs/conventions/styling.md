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

## Spacing and radii

`theme.gap.*` is the scale: `xs` 8, `sm` 12, `md` 16, `lg` 24, `xl` 32. It is the
spacing scale and the radius scale at once — there is no separate radius family — so a
border radius MUST be taken from `theme.gap.*` as well, and an on-scale spacing or
radius value MUST NOT be hard-coded.

Folding the two families together is a departure from the installed
`react-component-styling` capability, which requires that radius and spacing stay
separate precisely because one can move without the other. Splitting them out, along
with a duration family the theme does not have at all, is tracked as issue #72; until
it lands, the shared scale is what the code uses.

## Typography

`theme.typography.*` carries six composite text roles, each bundling a font family, a
size, and a line height, and each named for the content it carries rather than for its
size:

| Role       | Family                      | Size / leading | Carries                                                            |
| ---------- | --------------------------- | -------------- | ------------------------------------------------------------------ |
| `display`  | `InnovatorGrotesk-SemiBold` | 28 / 34        | A screen's hero title — the Home landing                           |
| `title`    | `InnovatorGrotesk-SemiBold` | 20 / 26        | A centered message state's title                                   |
| `heading`  | `InnovatorGrotesk-SemiBold` | 16 / 22        | Button labels, card titles, section headings, the collection monogram |
| `body`     | `InnovatorGrotesk-Regular`  | 16 / 22        | Running text, text inputs, list row labels                         |
| `caption`  | `InnovatorGrotesk-Regular`  | 13 / 18        | A form field's name, hints, errors, counts, metadata               |
| `code`     | `JetBrainsMono-Regular`     | 14 / 22        | A record id standing in for a title, id chips, build details       |

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
