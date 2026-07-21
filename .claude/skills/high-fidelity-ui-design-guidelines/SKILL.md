---
name: high-fidelity-ui-design-guidelines
description: How to build a high-fidelity UI design mockup — render the app's components and screens with the real design-system tokens (mirrored from src/common/constants/style.ts), in light and dark, on shared token grounds. Ships a self-contained, theme-aware template with an element palette (components in isolation) and a screen render (full screens in light/dark rails).
when_to_use: Use when producing a high-fidelity (real-token) UI mockup — rendering a chosen design at full fidelity with the project's real colors, type, spacing, and radii in both themes, e.g. the high-fidelity round of a design exhibit. The /address delivery skill uses it for its high-fidelity round; pair it with the wireframe design guidelines for the low-fidelity round.
user-invocable: false
---

# High-Fidelity UI Design Guidelines

Apply these guidelines when producing a **high-fidelity** UI mockup — rendering components and screens with the app's **real design tokens**, in light and dark, the fidelity where real color, type, spacing, and density become the subject. For **low-fidelity** wireframes, use the project's wireframe design guidelines instead. When these are used inside an `/address` design exhibit, the round/options/recording lifecycle is owned by the project's `/address` delivery skill; general page craft stays owned by the harness `artifact-design` guidance; the design-token *values* are owned by the project's component guidelines and `src/common/constants/style.ts`.

The template is [hifi-design-kit.html](./assets/hifi-design-kit.html) — a self-contained, theme-aware page carrying an **element palette** (components in isolation on paired light/dark grounds) and a **screen render** (full screens in light and dark rails). It is tailored to this project's tokens; copy it to a scratch location, fill it for the screen(s) at hand, and publish or export the result.

The normative rules below are grounded in the external field consensus captured in [best-practices.md](./references/best-practices.md) — 21 distilled principles cited to 60+ reputable sources (Nielsen Norman Group, Material Design 3, Apple Human Interface Guidelines, W3C/WAI WCAG, Laws of UX, shadcn/ui). Consult it for the reasoning and citations behind the guidance here; the MUST/SHOULD rules in this document remain authoritative, and design-token *values* stay owned by the project's component guidelines and `src/common/constants/style.ts`.

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

The mirrored tokens (as of the kit's authoring):

- Colors — `lightColors` / `darkColors`: `background`, `backgroundElevated`, `textPrimary`, `textSecondary`, `border`, `accent`, `accentContrast`, `danger`, `dangerContrast`.
- Radii — `radiusSizes`: `sm 8` / `md 12` / `lg 16` (`--r-sm` / `--r-md` / `--r-lg`).
- Type scale — `fontSizes`: `sm 13` / `md 16` / `lg 20` / `xl 28`.

**Guidelines:**

- MUST re-read `src/common/constants/style.ts` before a high-fidelity mockup and reconcile any drift between it and the `.device` / `.device.dark` (and `.el-surface`) custom properties in [hifi-design-kit.html](./assets/hifi-design-kit.html).
- MUST treat `style.ts` as the source of truth for token values; MUST NOT present the kit's mirrored values as authoritative.
- MUST keep the element palette on the same shared `.device, .el-surface` token block as the screen render — MUST NOT fork a second token set.
- SHOULD ground high-fidelity type, spacing, and radii in the real tokens rather than eyeballed values, so the render stays faithful to the app.
- SHOULD, when adapting this kit to a different project, repoint the mirrored token block at that project's design-system source and update the token list above.
