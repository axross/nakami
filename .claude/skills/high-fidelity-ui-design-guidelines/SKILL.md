---
name: high-fidelity-ui-design-guidelines
description: How to build a high-fidelity UI design mockup — render the app's components and screens with the real design-system tokens (mirrored from src/common/constants/style.ts), in light and dark, on shared token grounds. Ships a self-contained, theme-aware template with an element palette (components in isolation) and a screen render (full screens in light/dark rails).
when_to_use: Use when producing a high-fidelity (real-token) UI mockup — rendering a chosen design at full fidelity with the project's real colors, type, spacing, and radii in both themes, e.g. the high-fidelity round of a design exhibit. The /address delivery skill uses it for its high-fidelity round; pair it with the wireframe design guidelines for the low-fidelity round.
user-invocable: false
---

# High-Fidelity UI Design Guidelines

Apply these guidelines when producing a **high-fidelity** UI mockup — rendering components and screens with the app's **real design tokens**, in light and dark, the fidelity where real color, type, spacing, and density become the subject. For **low-fidelity** wireframes, use the project's wireframe design guidelines instead. When these are used inside an `/address` design exhibit, the round/options/recording lifecycle is owned by the project's `/address` delivery skill; general page craft stays owned by the harness `artifact-design` guidance; the design-token *values* are owned by the project's component guidelines and `src/common/constants/style.ts`.

The template is [hifi-design-kit.html](./assets/hifi-design-kit.html) — a self-contained, theme-aware page carrying an **element palette** (components in isolation on paired light/dark grounds) and a **screen render** (full screens in light and dark rails). It is tailored to this project's tokens; copy it to a scratch location, fill it for the screen(s) at hand, and publish or export the result.

The normative rules below are grounded in the external field consensus distilled in this skill's **Research-Grounded Best Practices** references (the routing section at the end of this document) — 21 principles across six topic files, each expanded with reasoning, do/don't examples, and citations to reputable sources (Nielsen Norman Group, Material Design 3, Apple Human Interface Guidelines, W3C/WAI WCAG, Laws of UX, shadcn/ui). The MUST/SHOULD rules in this document remain authoritative, and design-token *values* stay owned by the project's component guidelines and `src/common/constants/style.ts`.

## How to Use the Template

Produce one page per high-fidelity mockup. A high-fidelity mockup is reached only after the low-fidelity direction is chosen (per the wireframe design guidelines and, in an exhibit, the `/address` delivery skill's lifecycle).

**Guidelines:**

- MUST start a high-fidelity mockup from [hifi-design-kit.html](./assets/hifi-design-kit.html) rather than reinventing the format.
- MUST copy the template into a scratch location (outside the repository checkout) and build there; MUST NOT commit the kit-derived render into a repository on any branch.
- MUST keep the published page self-contained — no external fetches; the template uses system font stacks and inline SVG for exactly this reason.
- MUST consult the harness `artifact-design` guidance for general page craft before publishing.
- SHOULD delete the elements and screens a mockup does not use before publishing.
- MUST fill every `<!-- FILL: ... -->` point with the mockup's real content.

## Real-Token Rendering

The kit renders in two forms, both in light **and** dark: an **element palette** (components in isolation on two `.el-surface` grounds) and a **screen render** (full screens in `.rail`s). Both halves are built from one template by the page script, so the light and dark variants never drift.

**Guidelines:**

- MUST render high-fidelity mockups in both light and dark, and at the device sizes where the design differs, per the project's component guidelines theming rules.
- MUST keep the light and dark variants in lockstep — the template assembles both from one set of screen/element templates so a change lands in both themes at once; preserve that structure.
- MUST shape the mockup to its purpose: an options comparison renders its at-least-three candidates side by side, each labeled with rationale and trade-offs and exactly one marked recommended; a confirmation renders the single already-approved direction with no new options and no recommended marker.
- MUST NOT jump to high fidelity before a low-fidelity wireframe has established the direction (and, in an `/address` exhibit, produced the durable account-free record first).

## Tokens — Mirror, Don't Fork

A static HTML file cannot import the TypeScript token module, so the kit mirrors `src/common/constants/style.ts` as CSS custom properties on a shared `.device, .el-surface` block. That mirror can drift as the app's tokens change, so the kit treats `style.ts` as the source of truth and the CSS as a copy to reconcile per run.

The token shape to mirror (see `src/common/constants/style.ts` for current values):

- Colors — semantic role tokens under `theme.colors`: `foundation` / `surface` / `border` / `solid` / `text`, each × `neutral` / `accent` / `destructive` (plus `text.onAccent`). Neutrals are Radix Slate, destructive is Radix Ruby, accent is Radix Teal, in light and dark.
- Spacing **and** radii — `gap`: `xs 8` / `sm 12` / `md 16` / `lg 24` / `xl 32` (there is no separate radius token; radii reuse `gap`).
- Fonts — `fonts`: `heading` / `paragraph` / `label` (InnovatorGrotesk) and `monospace` (JetBrains Mono). There is no font-size scale; each text style inlines its `fontSize` paired with a `fonts.*` family.

The kit's own `hifi-design-kit.html` still renders from an earlier flat-token mirror; treat `style.ts` as the source of truth and reconcile the kit's CSS custom properties to the shape above when you build a mockup.

**Guidelines:**

- MUST re-read `src/common/constants/style.ts` before a high-fidelity mockup and reconcile any drift between it and the `.device` / `.device.dark` (and `.el-surface`) custom properties in [hifi-design-kit.html](./assets/hifi-design-kit.html).
- MUST treat `style.ts` as the source of truth for token values; MUST NOT present the kit's mirrored values as authoritative.
- MUST keep the element palette on the same shared `.device, .el-surface` token block as the screen render — MUST NOT fork a second token set.
- SHOULD ground high-fidelity type, spacing, and radii in the real tokens rather than eyeballed values, so the render stays faithful to the app.
- SHOULD, when adapting this kit to a different project, repoint the mirrored token block at that project's design-system source and update the token list above.

## Research-Grounded Best Practices

These references distill the external field consensus behind this skill's rules, one topic per file, each with expanded guidance, do/don't examples, and citations. The MUST/SHOULD rules elsewhere in this document remain authoritative.

See [tokens-and-theming.md](./references/tokens-and-theming.md) for:

- driving every visual value through layered semantic design tokens
- treating dark mode as a first-class, tone-based appearance

See [layout-and-spacing.md](./references/layout-and-spacing.md) for:

- building a deliberate visual hierarchy and validating it with a squint test
- grouping with proximity, whitespace, and common region
- anchoring layout to an 8px grid and respecting safe areas across device sizes

See [typography.md](./references/typography.md) for:

- building a semantic type scale instead of ad-hoc sizes
- tuning body text for readability — size, measure, and leading

See [color-and-contrast.md](./references/color-and-contrast.md) for:

- meeting text and non-text contrast minimums, recalculated separately for each theme
- never encoding meaning in color alone

See [interaction-states-and-feedback.md](./references/interaction-states-and-feedback.md) for:

- sizing and spacing touch targets, and making interactive elements look interactive
- designing complete, differentiated interaction states and preferring error surfacing over disabled controls
- writing clear error feedback and matching feedback to response-time thresholds

See [accessibility-and-cognitive-load.md](./references/accessibility-and-cognitive-load.md) for:

- providing a visible focus indicator with a logical focus order, and preference-aware motion
- using native semantics and labels for assistive technology
- reducing cognitive load and investing in visual quality without masking usability
