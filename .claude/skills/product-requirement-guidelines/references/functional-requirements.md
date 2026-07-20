# Functional Requirements

Apply this reference when drafting or reviewing the **Functional requirements** section of a spec — the observable behavior a change adds or alters, described at the specification level. In the canonical plan-document structure this section is conditional, and it is the parent of the **UI design** and **System design** subsections; this reference owns *when the section applies* and *how those subsections nest under it*, and delegates the craft of each subsection to its owning reference. Sourced from the same requirements-writing practice as the sibling references: functional requirements state what the system does in response to inputs, distinct from the non-functional targets (performance, security, accessibility) that constrain how well it does it.

## When to Include Functional Requirements

The section describes behavior — what the change makes the app do that a user or another system can observe. It applies whenever the change alters an observable behavior or capability, and it is omitted (with a one-line reason in its place) for a change with no functional surface: an internal refactor that preserves behavior, a dependency bump, a docs-only edit, or a pure configuration change.

**Guidelines:**

- MUST include a Functional requirements section whenever the change adds, removes, or alters observable app behavior or capability; MUST omit it — stating the one-line reason in place of the section — for a change with no functional surface (behavior-preserving refactor, dependency bump, docs-only, config-only).
- MUST describe behavior as observable inputs and outcomes (what the user does, what the app does in response), not as the implementation that produces it.
- MUST right-size the section to the change per [problem-and-scope.md › Right-Sizing Scope](./problem-and-scope.md#right-sizing-scope): a single new interaction earns a short list; a multi-surface feature earns more.
- SHOULD state each functional requirement atomically — one behavior, one reasonable interpretation — per [problem-and-scope.md › Concrete, Checkable Language](./problem-and-scope.md#concrete-checkable-language).

## UI Design and System Design Nest Under It

When a change is functional, two things follow from the behavior it introduces: how a person sees and operates it (UI design) and how the system is shaped to support it (System design). Both are subsections of Functional requirements, not top-level sections — they exist to elaborate the behavior stated above them, and each is itself conditional on its own trigger. The craft of each stays owned by its reference; this parent section only decides whether the subsection is present and keeps it anchored to the functional behavior it serves.

**Guidelines:**

- MUST nest **UI design** and **System design** as subsections of Functional requirements when they apply, not as sibling top-level sections.
- MUST include the **UI design** subsection when the change is view-affected, and follow [ui-design-framing.md](./ui-design-framing.md) for its content (hierarchy, interaction states, accessibility intent, responsive intent, copy constraints); omit it with a one-line reason for a non-view-affected functional change.
- MUST include the **System design** subsection — with an **Alternatives considered** subsection when a plausible competing approach exists — per the trigger and craft in [architecture-overview-framing.md](./architecture-overview-framing.md); omit it with a one-line reason when neither the architecture-boundary nor the intricate-mechanics trigger applies.
- MUST keep both subsections at spec fidelity — describing intent, not prescribing components, file layout, or routing mechanics owned by the component-guidelines, project-structure, and routing-guidelines skills.
