---
name: component-guidelines
description: How payload-mobile components are built — hand-rolled compound components following the porousel pattern (one directory per component, child parts wired through a private context), Unistyles theming with StyleSheet.create((theme) => …) and the design tokens in src/common/constants/style.ts, prop typing, testID hooks, and promotion criteria for shared components.
when_to_use: Use when writing, placing, reviewing, or refactoring a component or hook — composition, variants, styling/theming, prop typing, accessibility, test hooks, or whether a repeated pattern earns a shared component.
user-invocable: false
---

# Component Guidelines

This skill owns *how UI surfaces are built*. Where component files live belongs to Project Structure; route files belong to Routing Guidelines (both resolved via the `AGENTS.md` skill index). Components are hand-rolled on React Native primitives — no component library — following the composition and theming pattern of [axross/porousel](https://github.com/axross/porousel).

## Component Catalog

Shared components live under `src/common/components/`, one directory per component. Keep this list current as components land:

| Component | Purpose |
| --------- | ------- |
| `message-state` | Centered mark + title + subtitle surface with an optional action slot, shared by feature empty/error/placeholder screens |

**Guidelines:**

- MUST compose existing catalog components instead of re-creating their look; re-implementing an existing control's appearance is a review finding.
- MUST add a catalog row in this file when a new shared component lands.

## Compound-Component Composition

A component with configurable parts is a directory of cooperating files, not one file of render props: the parent renders the frame and provides a private context; child parts (`<X.Icon>`-style subcomponents named `x-icon.tsx`) consume that context to match the parent's variant.

```
src/common/components/button/
├── button.tsx           # parent: frame, variants, context provider
├── button-context.tsx   # private context: variant/intent/size + useButtonContext
├── button-text.tsx      # child part, styled from context
└── button-icon.tsx      # child part, styled from context
```

**Guidelines:**

- MUST give each component its own kebab-case directory with one file per part; the main file bears the component's name.
- MUST pass variant state (e.g. `variant`, `intent`, `size`) from parent to child parts through a private `<name>-context.tsx` context, never by re-declaring the props on every child.
- MUST throw from the context hook when a child part is rendered outside its parent (`<ButtonText> must be used within a <Button> component.`).
- MUST express variants as a closed union prop (`variant: "solid" | "translucent"`) styled via Unistyles variants or conditional style composition — not as boolean prop soup.
- MUST mark props `readonly` and type native-element passthroughs with `ComponentPropsWithoutRef<typeof Primitive>`.

## Styling and Theming

All styling goes through Unistyles; the theme (`src/common/constants/style.ts`) is the source of colors, spacing, radii, and fonts. Font **sizes** are the one deliberate exception — the theme carries no size scale, so each text style inlines its numeric `fontSize` paired with a `theme.fonts.*` family (mirroring the reference `axross/cunnpe` theme).

**Guidelines:**

- MUST style with `StyleSheet.create((theme) => ({ … }))` from `react-native-unistyles` and consume tokens: `theme.colors.*` (semantic role tokens — `foundation` / `surface` / `border` / `solid` / `text`, each × `neutral` / `accent` / `destructive`), `theme.gap.*` (scale spacing **and** border radii — there is no separate radius token), and `theme.fonts.*` (`heading` / `paragraph` / `label` / `monospace`). MUST NOT hard-code colors, or scale spacing/radii — every gap, padding, margin, and radius that maps to the scale MUST use `theme.gap.*` (snap to the nearest step rather than inlining an off-scale value). Inlined numeric literals are limited to: a text style's `fontSize` (paired with a `theme.fonts.*` family, since the theme has no size scale), fixed element dimensions (`width` / `height` / `min*` / `aspectRatio`), and 1px hairlines (row separators, `borderWidth`).
- MUST pick the color token by its semantic role, not its resemblance: an icon or text glyph uses a `text.*` (or `solid.*`) token, never a `border.*` token; an inset element uses a `surface.*` token, not a `foundation.*` background.
- MUST add new design tokens to `src/common/constants/style.ts` (both themes) rather than inlining a one-off color, spacing, or radius; light and dark themes MUST keep identical token shapes.
- MUST accept a `style` prop on the root element and merge it after the component's own styles, so consumers extend rather than fork.
- MUST NOT branch on the color scheme manually (`useColorScheme()`); adaptive theming is Unistyles' job.

## Logic Extraction

**Guidelines:**

- MUST keep data fetching out of components — screens consume the owning feature's `queries/`/`mutations/` hooks (see Maintainable Code Guidelines, abstraction-boundaries rules).
- SHOULD extract stateful logic reused by two or more components into a hook next to its owning feature; pure logic goes to `helpers/`.
- SHOULD keep Zustand stores feature-local and small; global stores need a stated reason.

## Promotion Criteria

**Guidelines:**

- MUST promote a repeated UI pattern to `src/common/components/` once a third feature needs it (or a second needs it identically); until then it stays in the owning feature's `components/`.
- MUST NOT build speculative variants/props no current consumer uses.

## Accessibility and Test Hooks

**Guidelines:**

- MUST give interactive components an `accessibilityRole` and an accessible name (`accessibilityLabel` when the visible content is not text).
- MUST put a kebab-case `testID` on each screen's root element and on elements e2e flows assert; Maestro locates by `id:` (see E2E Testing Guidelines).
- MUST keep touch targets at least 44×44 points.
- MUST NOT encode meaning in color alone — pair color with wording or an icon.
