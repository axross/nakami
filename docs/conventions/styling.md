# Styling

The theme tokens this app defines, what each family is for, and the breakpoint and
adaptive-theme settings registered alongside them.

Unistyles' own mechanics belong to the installed `react-component-styling` capability —
importing `StyleSheet` from the package, taking values from the `theme` argument,
keeping the light and dark maps structurally identical, choosing a colour by semantic
role rather than by resemblance. Design rationale — hierarchy, contrast targets, motion
taste — belongs to `high-fidelity-ui-design`. What follows is the token vocabulary
those capabilities are spent through, which only this repository defines.

Every token is declared in `src/common/constants/style.ts` and registered, with the
breakpoints, in `src/unistyles.ts`.

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
to `src/common/constants/style.ts` rather than inlined at the use site, so that the
value has one definition and the dark theme cannot silently miss it.

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

`theme.fonts.*` carries four role names, each mapping to a family bundled under
`assets/fonts/`:

| Role        | Family                       |
| ----------- | ---------------------------- |
| `heading`   | `InnovatorGrotesk-SemiBold`  |
| `paragraph` | `InnovatorGrotesk-Regular`   |
| `label`     | `InnovatorGrotesk-Regular`   |
| `monospace` | `JetBrainsMono-Regular`      |

The theme carries no font-size scale, so a text style pairs one of these families with
a size that has no token behind it. The `fontSize` literals inlined across the codebase
today are a standing violation rather than a permitted exception, and issue #71 owns
them.

## Breakpoints

The registered breakpoints are `xs` 0, `sm` 380, and `md` 768, exported as
`breakpoints` from `src/common/constants/style.ts`. A responsive style value is written
against these names — the installed `react-component-styling` capability already
requires responsive values to be written against the project's declared breakpoints,
and these are they.

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
hand-maintained mirror that drifts silently. `src/common/constants/style.ts` MUST be
re-read before each high-fidelity round and any drift reconciled into the kit, and the
kit MUST stay self-contained — no external fetches, system fonts and inline SVG only —
because it is opened straight from disk with no server behind it.
