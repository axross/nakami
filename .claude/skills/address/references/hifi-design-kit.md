# Hi-Fi Design Kit

Apply this reference when building the **Artifact** for an `/address` **high-fidelity round**. It owns rendering the app's components and screens with the **real design tokens**, in light and dark — the fidelity where real color, type, spacing, and density become the subject. The **wireframe round** uses the project's wireframe kit instead (see [wireframe-kit.md](./wireframe-kit.md)). The exhibit *lifecycle* — which round uses which kit, options vs confirmation rounds, the fidelity ladder, recording the choice — stays owned by [visual-design-options.md](./visual-design-options.md); general page craft stays owned by the harness `artifact-design` guidance; the design-token *values* are owned by the project's component guidelines and `src/common/constants/style.ts`.

The template is [hifi-design-kit.html](../assets/hifi-design-kit.html) — a self-contained, theme-aware page carrying an **element palette** (components in isolation on paired light/dark grounds) and a **screen render** (full screens in light and dark rails). Copy it to the harness scratchpad, fill it for the screen(s) at hand, and publish the result as an Artifact.

## How to Use the Template

A high-fidelity round produces one Artifact built from this kit; the wireframe round is built from the wireframe kit instead. The high-fidelity round is reached only after the wireframe direction is chosen, per [visual-design-options.md](./visual-design-options.md).

**Guidelines:**

- MUST start a high-fidelity round's Artifact from [hifi-design-kit.html](../assets/hifi-design-kit.html) rather than reinventing the format.
- MUST copy the template into the harness scratchpad (outside the repository checkout) and build there; MUST NOT commit the kit-derived render to the repository on any branch.
- MUST keep the published page self-contained — no external fetches; the template uses system font stacks and inline SVG for exactly this reason.
- MUST consult the harness `artifact-design` guidance for general page craft before publishing.
- SHOULD delete the elements and screens a round does not use before publishing.
- MUST fill every `<!-- FILL: ... -->` point with the round's real content.

## Real-Token Rendering

The kit renders in two forms, both in light **and** dark: an **element palette** (components in isolation on two `.el-surface` grounds) and a **screen render** (full screens in `.rail`s). Both halves are built from one template by the page script, so the light and dark variants never drift.

**Guidelines:**

- MUST render high-fidelity rounds in both light and dark, and at the device sizes where the design differs, per the project's component guidelines theming rules.
- MUST keep the light and dark variants in lockstep — the template assembles both from one set of screen/element templates so a change lands in both themes at once; preserve that structure.
- MUST shape the Artifact to the round: an options round renders its at-least-three candidates side by side, each labeled with rationale and trade-offs and exactly one marked `(Recommended)`; a confirmation round renders the single already-approved direction with no new options and no `(Recommended)` marker (which shape applies follows [visual-design-options.md](./visual-design-options.md)).
- MUST NOT open a high-fidelity round without the wireframe round having produced the durable account-free record first, per [visual-design-options.md](./visual-design-options.md).

## Tokens — Mirror, Don't Fork

A static HTML file cannot import the TypeScript token module, so the kit mirrors `src/common/constants/style.ts` as CSS custom properties on a shared `.device, .el-surface` block. That mirror can drift as the app's tokens change, so the kit treats `style.ts` as the source of truth and the CSS as a copy to reconcile per run.

The mirrored tokens (as of the kit's authoring):

- Colors — `lightColors` / `darkColors`: `background`, `backgroundElevated`, `textPrimary`, `textSecondary`, `border`, `accent`, `accentContrast`, `danger`, `dangerContrast`.
- Radii — `radiusSizes`: `sm 8` / `md 12` / `lg 16` (`--r-sm` / `--r-md` / `--r-lg`).
- Type scale — `fontSizes`: `sm 13` / `md 16` / `lg 20` / `xl 28`.

**Guidelines:**

- MUST re-read `src/common/constants/style.ts` before a high-fidelity round and reconcile any drift between it and the `.device` / `.device.dark` (and `.el-surface`) custom properties in [hifi-design-kit.html](../assets/hifi-design-kit.html).
- MUST treat `style.ts` as the source of truth for token values; MUST NOT present the kit's mirrored values as authoritative.
- MUST keep the element palette on the same shared `.device, .el-surface` token block as the screen render — MUST NOT fork a second token set.
- SHOULD ground high-fidelity type, spacing, and radii in the real tokens rather than eyeballed values, so the render stays faithful to the app.
