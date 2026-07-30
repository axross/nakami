# Components and Theming

Apply this reference when building or changing a component, reaching for a theme token, or preparing a high-fidelity design round.

Components here are hand-rolled on React Native primitives — no UI component library, icons excepted — following the composition and theming pattern of [axross/porousel](https://github.com/axross/porousel).

## Shared Component Catalog

Shared components live under `src/common/components/`, one directory per component. This catalog is the inventory; it is only useful while it is current.

| Component       | Purpose                                                                                                         |
| --------------- | ----------------------------------------------------------------------------------------------------------------- |
| `message-state` | Centered mark + title + subtitle surface with an optional action slot, shared by empty/error/placeholder screens |

**Guidelines:**

- MUST compose an existing catalog component instead of re-creating its look, and MUST add a catalog row when a new shared component lands.

## Component Anatomy

A component is a directory, not a file: the main file bears the component's name, and each child part gets its own file beside it. Variant state reaches the parts through a private context rather than being re-declared as props on every one of them, which is also what makes a part rendered outside its parent detectable.

**Guidelines:**

- MUST give each component its own kebab-case directory with one file per part; the main file bears the component's name, and child parts (`button-text.tsx`, `button-icon.tsx`) read variant state from a private `<name>-context.tsx` rather than re-declaring props.
- MUST throw from the context hook when a child part renders outside its parent (`<ButtonText> must be used within a <Button> component.`).

## Theme Tokens

Styles are written with `StyleSheet.create((theme) => ({ … }))` from `react-native-unistyles`, consuming tokens from `src/common/constants/style.ts`:

- `theme.colors.<role>.<tone>.<step>` — roles `foundation` / `surface` / `border` / `solid` / `text`, each × tones `neutral` / `accent` / `destructive`. Step names differ per role (`bare`/`subtle` for foundation, `base`/`highlight` for surface, `subtle`/`base`/`intense` for border, `base`/`intense` plus accent-only `baseAlpha`/`intenseAlpha` for solid, `base`/`intense` for text). `theme.colors.text.onAccent` is the one flat token — text drawn on a solid accent fill. The scales mirror [axross/cunnpe](https://github.com/axross/cunnpe): Radix Slate for neutral, Teal for accent, Ruby for destructive.
- `theme.gap.*` (`xs` 8 / `sm` 12 / `md` 16 / `lg` 24 / `xl` 32) for scale spacing **and** border radii — there is no separate radius token.
- `theme.fonts.*` (`heading` / `paragraph` / `label` / `monospace`).

**Guidelines:**

- MUST style with `StyleSheet.create((theme) => ({ … }))` and consume the tokens above.
- MUST NOT hard-code a color, or an on-scale spacing or radius value. Inlined numeric literals are limited to a text style's `fontSize` (paired with a `theme.fonts.*` family, since the theme carries no size scale), fixed element dimensions, and 1px hairlines.
- MUST pick a color token by its semantic role, not its resemblance: a glyph uses a `text.*` or `solid.*` token, never `border.*`; an inset element uses `surface.*`, not `foundation.*`.
- MUST add a new token to `src/common/constants/style.ts` in **both** themes rather than inlining a one-off value; light and dark MUST keep identical token shapes.

## Breakpoints and Adaptive Themes

Responsive values are written against the `breakpoints` exported beside the tokens and registered in `src/unistyles.ts`, which also sets `adaptiveThemes: true`. That setting is the one to remember: the theme follows the OS color scheme with no in-app toggle, so a scheme switch swaps the theme object underneath a screen that is already mounted.

**Guidelines:**

- MUST write responsive style values against the `breakpoints` exported from `src/common/constants/style.ts` (`xs` 0 / `sm` 380 / `md` 768) and registered in `src/unistyles.ts`.

## Icons and Vector Assets

`lucide-react-native` is the app's single icon set and the one exception to "no UI component library". How a component takes its icon depends on who chooses it.

**Guidelines:**

- MUST source in-app icons from `lucide-react-native`. A component that chooses its own icon imports the Lucide component directly and sizes/colors it from the theme; a component that lets its caller choose accepts a `LucideIcon` component prop, never a glyph-name string.
- MAY import a bespoke `.svg` as a React component (via `react-native-svg-transformer`, configured in `metro.config.js` and typed by `declarations.d.ts`) when a design needs a vector Lucide does not cover.

## Accessibility and Test Hooks

Every interactive surface carries the semantics assistive technology needs, and every surface an e2e flow touches carries the hook Maestro locates it by — Maestro matches on `id:`, so an element without a `testID` is unreachable from a flow.

**Guidelines:**

- MUST give interactive components an `accessibilityRole` and an accessible name, keep touch targets at least 44×44 points, and never encode meaning in color alone.
- MUST put a kebab-case `testID` on each screen's root element and on every element an e2e flow asserts.

## Promotion to the Shared Catalog

A pattern earns its way into `src/common/components/` by being needed more than once; until then it stays with the feature that owns it, where changing it costs nothing to anyone else.

**Guidelines:**

- MUST promote a repeated UI pattern to `src/common/components/` once a third feature needs it (or a second needs it identically); until then it stays in the owning feature's `components/`.

## The High-Fidelity Design Kit

`.claude/assets/hifi-design-kit.html` is a self-contained, theme-aware HTML template that renders this app's components and screens with the **real** tokens above, in light and dark. Use it for the high-fidelity round of a design exhibit — the round where concrete color, type, and spacing are the subject — after the layout has been settled with the wireframe kit that ships inside the wireframe design capability. Design rationale belongs to the high-fidelity UI design capability; this kit only supplies the tokens.

**Guidelines:**

- MUST re-read `src/common/constants/style.ts` before each high-fidelity round and reconcile any drift into the kit — a static HTML file cannot import the TypeScript, so its token block is a hand-maintained mirror.
- MUST keep the kit self-contained: no external fetches, system fonts and inline SVG only.
