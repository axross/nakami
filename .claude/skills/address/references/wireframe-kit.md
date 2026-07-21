# Wireframe Kit

Apply this reference when building the **Artifact** for an `/address` **wireframe round** (low fidelity). It owns a **project-agnostic** breadboard screen-mockup vocabulary usable for any client app — mobile or web/desktop: two device canvases (a mobile phone frame and a browser window), the breadboard primitives, the component library, the archetypes, and the option-comparison layout — regions, hierarchy, and flow, never brand color or final type. The **high-fidelity round** uses the project's hi-fi design kit instead (see [hifi-design-kit.md](./hifi-design-kit.md)). The exhibit *lifecycle* — which round uses which kit, options vs confirmation rounds, the fidelity ladder, recording the choice — stays owned by [visual-design-options.md](./visual-design-options.md); general page craft (typography, palette, spacing rhythm) stays owned by the harness `artifact-design` guidance.

The template is [wireframe-kit.html](../assets/wireframe-kit.html) — a self-contained, theme-aware page carrying the breadboard component library, the archetypes, and the options-round layout. Copy it to the harness scratchpad, delete the parts you are not presenting, fill it for the screen(s) at hand, and publish the result as an Artifact.

## How to Use the Template

The template is a copy-and-fill starting point, not a library to import. A wireframe round produces one Artifact built from this kit; the high-fidelity round is built from the hi-fi design kit instead.

**Guidelines:**

- MUST start a wireframe round's Artifact from [wireframe-kit.html](../assets/wireframe-kit.html) rather than reinventing the format, so exhibits stay visually consistent across runs and authors.
- MUST copy the template into the harness scratchpad (outside the repository checkout) and build there; MUST NOT commit the kit-derived mockup or any render to the repository on any branch, per [visual-design-options.md](./visual-design-options.md).
- MUST keep the published page self-contained — no external fetches (no CDN fonts, scripts, or remote images); the template uses system font stacks for exactly this reason.
- MUST consult the harness `artifact-design` guidance for general page craft before publishing; this kit governs the mockup vocabulary, not the whole page.
- SHOULD delete the components, states, and archetypes a round does not use before publishing, so the Artifact shows only the round's design.
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
| Input field | `.field` > `.box` (`.filled`/`.focus`/`.invalid`) | a dashed box — a text input |
| Button | `.btn` (`.primary`/`.ghost`/`.danger`/`.sm`/`.lg`) | a solid fill; `.primary` uses the accent |
| Error row | `.err` (`.dot` + `.ln`) | danger-tinted inline error |
| Tab bar | `.tabbar` > `.tab` (`.active`) | bottom tabs; active tab uses the accent |
| List / settings group | `.group` > `.rows` > `.row` (`.danger`) | grouped rows; `.danger` for destructive |
| Modal sheet | `.modal-scrim` + `.sheet` (`.grabber`) | a bottom sheet over a dimmed screen |
| Inline card | `.inline-card` | content embedded in a card on the primary surface |
| Browser canvas | `.browser` (`.chrome`, `.win`) | a web/desktop window |
| Top nav (web) | `.web-topnav` (`.brand`, `.links`, `.actions`) | a web top navigation bar |
| Sidebar layout (web) | `.web-shell` (`.side`, `.main`) | a web app shell with a sidebar |
| Side drawer (web) | `.web-drawer` + `.scrim` | a panel sliding in from the edge |

**Guidelines:**

- MUST keep the whole page at breadboard fidelity: greys, dashed inputs, solid buttons, danger tint — never app color (beyond the single accent/danger cue the primitives carry), final typography, or final copy.
- MUST include the legend when the wireframe uses the primitives, so the breadboard is self-explaining without a claude.ai account.
- MUST signal destructive affordances with the danger primitive **and** an icon or label shape, never color alone, matching the app's accessibility intent.
- SHOULD reach for a primitive directly when no archetype or component fits, rather than bending one out of shape.

## Component Library

The template opens with the common UI components client apps share (the shadcn-UI / Material vocabulary), grouped and laid out in isolation — the parts an author assembles into a screen when no archetype fits. Groups: *Foundations* (heading/label, body text, avatar + stack, badge, divider, skeleton, **mobile + web canvas**); *Inputs & controls* (text input, textarea, select — web and native-mobile variants, checkbox, radio group, switch, slider, date picker); *Buttons & menus* (button, button group, dropdown menu, tooltip, progress); *Containers & navigation* (card, **sectioned navigation** — the grouped settings rows, tabs, pagination, carousel, empty state, message bubbles); *Data* (table / data table); *Feedback* (banner/alert incl. destructive, toast/sonner); *Navigation & overlays — mobile + web* rendered inside device/browser frames (dialog, alert dialog, bottom sheet/drawer, bottom tabs; **top nav bar, sidebar layout, side drawer** for web). Each specimen is a `.wc-*`/`.web-*` breadboard part or a reuse of an existing primitive.

The grouped settings rows are named **sectioned navigation** consistently — the same component the Settings archetype and screen use.

**Guidelines:**

- SHOULD assemble a novel screen from the library's components when no archetype fits, rather than bending an archetype out of shape.
- SHOULD show a component's relevant **states and variant axes** when they clarify the design — states (default, filled, focus, invalid/error, selected/checked, disabled), and where they apply importance (primary/secondary/tertiary), tone (neutral/accent/destructive), size (sm/md/lg), and loading. The library carries these as labeled rows, greys plus the single accent cue for selected/active/primary and the danger tint for invalid/destructive.
- MAY reach for a primitive directly when no component fits; MUST NOT let the catalog flatten genuinely different screens into the same shape (templated sameness).
- SHOULD delete the components and states a round does not use before publishing.

## Archetypes

The template ships assembled breadboards for common screens in **both canvases** — mobile (empty state, form with error, settings/list group, tab-bar states, modal sheet, inline card) and web/desktop (app shell with nav + sidebar, form page, table/list page, modal dialog). They are **optional starting points**, present to speed authoring, not a required catalog.

**Guidelines:**

- MAY start from an archetype and adapt it; MUST NOT let the catalog flatten genuinely different screens into the same shape.
- MUST delete archetypes the round does not use before publishing.
- SHOULD add a one-line caption under each screen naming its regions, as the template does, so the intent survives at breadboard fidelity.
- SHOULD note per screen how its layout adapts across device sizes (small phones, large phones, tablets, desktop widths) when it materially differs, using the target project's own breakpoints.

## Options-Round Layout

An options round is a real decision, so the comparison must let the human weigh candidates side by side. The template's `.grid-options` renders each option as a `.card` with a label, a mockup, a rationale, and its trade-offs; the recommended option gets `.card.rec` and a `.badge`.

**Guidelines:**

- MUST present at least three options, each differing on a structural axis — hierarchy, layout, or visual treatment — not merely decoration, per [visual-design-options.md](./visual-design-options.md).
- MUST give every option a sketch, a rationale, and its trade-offs, and mark exactly one `(Recommended)`.
- SHOULD render screens shared across all options once, above the option grid, rather than repeating them in each card.
- MUST keep the embedded ASCII/Mermaid wireframe in the GitHub issue as the account-free fallback alongside the Artifact; the kit produces the Artifact, not the fallback.
