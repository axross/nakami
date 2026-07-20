---
name: product-requirement-guidelines
description: How to write a product requirement, feature spec, or issue description, and the canonical plan-document structure this skill owns — Summary; Background (goals, non-goals, assumptions); Functional requirements (with nested UI design and system design); Non-functional requirements; Acceptance criteria; Verification strategy; Open questions. Covers framing the problem/outcome before the solution, separating "what" from "how", right-sizing scope, per-section omit-rules, testable acceptance criteria, and stating the verification strategy.
when_to_use: Apply when writing, refining, or reviewing a requirement or spec — including any plan-writing or issue-drafting step of a delivery workflow — or when deciding which plan sections a change needs. "write a PRD", "refine this issue", "what sections does this plan need", "write acceptance criteria", "is this requirement testable", or "does this need a UI design / system design section".
user-invocable: false
---

# Product Requirement Guidelines

Apply this skill whenever drafting or reviewing a product requirement, feature spec, or issue description — the parts that describe **what** is needed and **how completion is verified**, not how it is built. It is general-purpose: any product requirement, feature specification, or issue description benefits from it, not only a delivery workflow's plan-writing step.

This skill owns the **canonical plan-document structure** — the section order, which sections are required versus conditional, and the per-section craft. A delivery workflow such as the project's `/address` workflow names that section order and delegates the section craft here; it does not restate the section rules. That keeps the structure single-sourced: change a section's rules here and every plan document follows.

This skill deliberately does not own everything a spec contains. It owns problem framing, scope boundaries, the section structure, acceptance-criteria and verification-strategy craft, and — when those sections are warranted — the spec-level framing of the UI design and system-design sections nested under Functional requirements. It does not own the implementation mechanics behind them:

- UI component structure, styling, and markup mechanics — the component-guidelines skill. This skill owns only how to *describe* hierarchy, states, accessibility, and responsive intent in the spec.
- Actual data flow implementation, routes, and module placement — the project-structure and routing-guidelines skills. This skill owns only how to *describe* system-design decisions in the spec.
- Test coverage design — the project's end-to-end testing and unit-test guidelines. This skill owns only how to *state the verification strategy* in the spec.

## Canonical Plan-Document Structure

A spec follows this section order. **Required** sections are always present; **conditional** sections are included when their trigger applies and omitted only with a one-line stated reason in place of the section, never dropped silently or left blank.

1. **Summary** *(required)* — one standalone paragraph a reader can grasp without the rest of the document. See [problem-and-scope.md](./references/problem-and-scope.md).
2. **Background** *(required)* — the problem and context, with **Goals**, **Non-goals**, and **Assumptions** subsections. See [problem-and-scope.md](./references/problem-and-scope.md).
3. **Functional requirements** *(conditional)* — the observable behavior the change adds or alters, with **UI design** and **System design** nested under it (System design carries an **Alternatives considered** subsection when a plausible competing approach exists). Omit for a change with no functional surface, stating why. See [functional-requirements.md](./references/functional-requirements.md), which delegates UI design to [ui-design-framing.md](./references/ui-design-framing.md) and system design to [architecture-overview-framing.md](./references/architecture-overview-framing.md).
4. **Non-functional requirements** *(conditional)* — measurable performance, scale, security, or accessibility targets the change must meet. Omit when none apply, stating why. See [architecture-overview-framing.md › Constraints and Non-Functional Requirements](./references/architecture-overview-framing.md#constraints-and-non-functional-requirements).
5. **Acceptance criteria** *(required)* — the plain-bullet checklist a reviewer verifies the finished change against. See [acceptance-criteria.md](./references/acceptance-criteria.md).
6. **Verification strategy** *(required)* — how the change is verified (which project checks and manual passes exercise it), distinct from the pass/fail conditions themselves. See [verification-strategy.md](./references/verification-strategy.md).
7. **Open questions** *(required; may be "None")* — unresolved decisions that block confident planning, distinct from assumptions. See [problem-and-scope.md › Assumptions vs. Open Questions](./references/problem-and-scope.md#assumptions-vs-open-questions).

**Guidelines:**

- MUST order the sections as above and keep every required section present; a required section with nothing to say states that briefly (e.g. Open questions: "None — scope is fully settled") rather than being dropped.
- MUST include a conditional section (Functional requirements, Non-functional requirements) when its trigger applies, and when omitting it, state the one-line reason in place of the section rather than deleting it silently.
- MUST right-size every section to the change per [problem-and-scope.md › Right-Sizing Scope](./references/problem-and-scope.md#right-sizing-scope); a small change earns short sections, not a skipped structure.
- SHOULD let a delivery workflow name only the section order and delegate the per-section craft here, so the structure has one owner.

## Product Requirement Section Template

See [template.md](./references/template.md) for a self-contained, annotated Markdown skeleton of the full seven-section structure — what belongs in each slot and how the omit-rules read inline.
