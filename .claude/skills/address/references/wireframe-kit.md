# Wireframe Kit

Apply this reference when building the **Artifact** for an `/address` design round — wireframe or high fidelity. It owns the project's *screen-mockup vocabulary*: the phone frame, the breadboard primitives, the archetypes, the option-grid comparison layout, and the wireframe-vs-high-fidelity fidelity contract. The exhibit *lifecycle* — when a round triggers, options vs confirmation rounds, the fidelity ladder, recording the choice — stays owned by [visual-design-options.md](./visual-design-options.md); general page craft (typography, palette, spacing rhythm) stays owned by the harness `artifact-design` guidance; the design-token *values* stay owned by the project's component guidelines and `src/common/constants/style.ts`. This kit sits between them and owns only what a Payload Mobile screen mockup looks like.

The template is [wireframe-kit.html](./wireframe-kit.html) — a self-contained, theme-aware page carrying both modes. It opens with a **UI-elements palette** (components in isolation, both fidelities) and then the **screen showcase** (archetypes, the options-round layout, and full rendered screens). Copy it to the harness scratchpad, delete the parts you are not presenting, fill it for the screen(s) at hand, and publish the result as an Artifact.

## How to Use the Template

The template is a copy-and-fill starting point, not a library to import. Each round produces one Artifact: a wireframe round fills the wireframe mode; a high-fidelity round fills the high-fidelity mode.

**Guidelines:**

- MUST start each round's Artifact from [wireframe-kit.html](./wireframe-kit.html) rather than reinventing the format, so exhibits stay visually consistent across runs and authors.
- MUST copy the template into the harness scratchpad (outside the repository checkout) and build there; MUST NOT commit the kit-derived mockup or any render to the repository on any branch, per [visual-design-options.md](./visual-design-options.md).
- MUST keep the published page self-contained — no external fetches (no CDN fonts, scripts, or remote images); the template uses system font stacks and inline SVG for exactly this reason.
- MUST consult the harness `artifact-design` guidance for general page craft before publishing; this kit governs the mockup vocabulary, not the whole page.
- SHOULD delete the mode not in use, the unused elements, and the unused archetypes before publishing, so the Artifact shows only the round's design.
- MUST fill every `<!-- FILL: ... -->` point with the round's real content and remove leftover placeholder labels.

## Breadboard Primitives

A wireframe shows places, affordances, and flow — regions and their arrangement — not fonts, exact spacing, or final copy. The template gives each primitive a class and a legend swatch so a reviewer can read the breadboard without a key.

| Primitive | Class | Reads as |
| --- | --- | --- |
| Device frame | `.phone` > `.screen` | a mobile screen (rounded chrome) |
| Header / nav bar | `.navbar` (`.back`, `.title`) | top navigation with optional back affordance |
| App mark / icon block | `.w-mark` | logo or feature icon |
| Heading / label | `.w-h` (`.lg`) | a solid grey bar — emphasis text |
| Body text line | `.w-t` (`.w80`/`.w60`/`.w40`) | a lighter grey bar — running text |
| Input field | `.field` > `.box` (`.filled`) | a dashed box — a text input (filled = has a value) |
| Button | `.btn` (`.primary`) | a solid fill; `.primary` uses the accent |
| Error row | `.err` (`.dot` + `.ln`) | danger-tinted inline error |
| Tab bar | `.tabbar` > `.tab` (`.active`) | bottom tabs; active tab uses the accent |
| List / settings group | `.group` > `.rows` > `.row` (`.danger`) | grouped rows; `.danger` for destructive |
| Modal sheet | `.modal-scrim` + `.sheet` (`.grabber`) | a bottom sheet over a dimmed screen |
| Inline card | `.inline-card` | content embedded in a card on the primary surface |

**Guidelines:**

- MUST keep wireframe Artifacts at breadboard fidelity: greys, dashed inputs, solid buttons, danger tint — never app color (beyond the single accent/danger cue the primitives carry), final typography, or final copy.
- MUST include the legend when the wireframe uses the primitives, so the breadboard is self-explaining without a claude.ai account.
- MUST signal destructive affordances with the danger primitive **and** an icon or label shape, never color alone, matching the app's accessibility intent.
- SHOULD reach for a primitive directly when no archetype fits, rather than bending an archetype out of shape.

## UI Elements Palette

The template opens with the components laid out in isolation — the parts an author assembles into a screen when no archetype fits. It has two halves:

- **Wireframe component library** (breadboard greys) — a grouped gallery modelling the common shadcn-UI components in this project's mobile vocabulary. Groups: *Foundations* (heading/label, body text, avatar + stack, badge, divider, skeleton); *Inputs & controls* (text input, textarea, select — web and native-mobile variants, checkbox, radio group, switch, slider, date picker); *Buttons & menus* (button, primary button, button group, dropdown menu, tooltip, progress); *Containers & navigation* (card, **sectioned navigation** — the grouped settings rows, tabs, pagination, carousel, empty state, message bubbles); *Data* (table / data table); *Feedback* (banner/alert incl. destructive, toast/sonner); *Overlays & mobile navigation* rendered inside mini device frames (dialog, alert dialog, bottom sheet/drawer, bottom tabs). Each specimen is a `.wc-*` breadboard part or a reuse of an existing primitive.
- **High-fidelity palette** — a subset of the same components rendered on two `.el-surface` grounds (light and dark) that reuse the real-token screen classes (`.el-btn`, `.input` with default/placeholder/focused/error states, `.item`, `.tabs`). The two surfaces are built from one template by the page script, so light and dark never drift.

The grouped settings rows are named **sectioned navigation** consistently — the same component the Settings archetype and screen use.

**Guidelines:**

- SHOULD assemble a novel screen from the library's components when no archetype fits, rather than bending an archetype out of shape.
- SHOULD show a component's relevant **states and variant axes** when they clarify the design — states (default, filled, focus, invalid/error, selected/checked, disabled), and where they apply importance (primary/secondary/tertiary), tone (neutral/accent/destructive), size (sm/md/lg), and loading. The library carries these as labeled rows, greys plus the single accent cue for selected/active/primary and the danger tint for invalid/destructive.
- MUST keep the wireframe component library at breadboard fidelity (greys, the single accent cue for active/selected, danger tint for destructive) — never app color, final typography, or final copy.
- MUST keep the high-fidelity specimens on the shared `.el-surface` token grounds — they consume the same mirrored `src/common/constants/style.ts` tokens as the `.device`; MUST NOT fork a second token set.
- SHOULD delete the components a round does not use before publishing, the same as unused archetypes.
- MUST signal destructive components (destructive banner, alert-dialog danger action, sign-out row) with the danger tint **and** an icon or label shape, never color alone.

## Archetypes

The template ships assembled breadboards for the screens this app tends to need — empty state, form (with error), settings/list group, tab-bar states, modal sheet, inline card. They are **optional starting points**, present to speed authoring, not a required catalog.

**Guidelines:**

- MAY start from an archetype and adapt it; MUST NOT let the catalog flatten genuinely different screens into the same shape (templated sameness).
- MUST delete archetypes the round does not use before publishing.
- SHOULD add a one-line caption under each screen naming its regions, as the template does, so the intent survives at breadboard fidelity.
- SHOULD note per screen how its layout adapts across device sizes (small phones, large phones, tablets) when it materially differs — the app's breakpoints are `xs 0 / sm 380 / md 768`.

## The Two Modes and the Fidelity Contract

The kit encodes the wireframe-vs-high-fidelity distinction structurally, so the fidelity ladder in [visual-design-options.md](./visual-design-options.md) has a concrete visual contract rather than only prose.

- **Wireframe mode** — grey breadboard primitives on a theme-aware page. Regions, hierarchy, and flow only. This is the first round's fidelity and the shape of every embedded ASCII/Mermaid fallback.
- **High-fidelity mode** — the same layouts rendered on a `.device` whose tokens mirror the app, shown in **light and dark** rails. This is where real color, type, spacing, and density become the subject.

**Guidelines:**

- MUST hold a wireframe round's Artifact to breadboard fidelity — the same fidelity as its embedded sketch — and MUST NOT spend it on color, exact typography, or final copy.
- MUST render high-fidelity rounds in both light and dark, and at the device sizes where the design differs, per the project's component guidelines theming rules.
- MUST shape the Artifact to the round: an options round renders its at-least-three candidates side by side, each labeled with rationale and trade-offs and exactly one marked `(Recommended)`; a confirmation round renders the single already-approved direction with no new options and no `(Recommended)` marker.
- MUST NOT skip the wireframe round and open straight at high fidelity; the embedded wireframe is the durable account-free record every later round depends on.

## High-Fidelity Tokens — Mirror, Don't Fork

A static HTML file cannot import the TypeScript token module, so the high-fidelity `.device` mirrors `src/common/constants/style.ts` as CSS custom properties. That mirror can drift as the app's tokens change, so the kit treats `style.ts` as the source of truth and the CSS as a copy to reconcile per run.

The mirrored tokens (as of the kit's authoring):

- Colors — `lightColors` / `darkColors`: `background`, `backgroundElevated`, `textPrimary`, `textSecondary`, `border`, `accent`, `accentContrast`, `danger`, `dangerContrast`.
- Radii — `radiusSizes`: `sm 8` / `md 12` / `lg 16` (`--r-sm` / `--r-md` / `--r-lg`).
- Type scale — `fontSizes`: `sm 13` / `md 16` / `lg 20` / `xl 28`.

**Guidelines:**

- MUST re-read `src/common/constants/style.ts` before a high-fidelity round and reconcile any drift between it and the `.device` / `.device.dark` custom properties in [wireframe-kit.html](./wireframe-kit.html).
- MUST treat `style.ts` as the source of truth for token values; MUST NOT present the kit's mirrored values as authoritative.
- MUST keep the light and dark renders in lockstep — the template assembles both rails from one set of screen templates so a change lands in both themes at once; preserve that structure.
- SHOULD ground high-fidelity type, spacing, and radii in the real tokens rather than eyeballed values, so the render stays faithful to the app.

## Options-Round Layout

An options round is a real decision, so the comparison must let the human weigh candidates side by side. The template's `.grid-options` renders each option as a `.card` with a label, a mockup, a rationale, and its trade-offs; the recommended option gets `.card.rec` and a `.badge`.

**Guidelines:**

- MUST present at least three options, each differing on a structural axis — hierarchy, layout, or visual treatment — not merely decoration, per [visual-design-options.md](./visual-design-options.md).
- MUST give every option a sketch, a rationale, and its trade-offs, and mark exactly one `(Recommended)`.
- SHOULD render screens shared across all options once, above the option grid, rather than repeating them in each card.
- MUST keep the embedded ASCII/Mermaid wireframe in the GitHub issue as the account-free fallback alongside the Artifact; the kit produces the Artifact, not the fallback.
