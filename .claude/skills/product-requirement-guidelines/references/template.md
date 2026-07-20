# Product Requirement Section Template

Apply this reference as a starting skeleton for a spec that follows the canonical plan-document structure. It is self-contained: copy the skeleton, fill each slot per the referenced sibling references, and delete the annotations (the italic notes) before publishing. Keep every required section; include a conditional section when its trigger applies, and when it does not, replace the section body with a one-line reason rather than leaving it blank or dropping the heading.

**Guidelines:**

- MUST keep every required section (Summary, Background, Acceptance criteria, Verification strategy, Open questions) and fill it, or — for Open questions with nothing outstanding — state "None" and why.
- MUST include each conditional section (Functional requirements, Non-functional requirements) when its trigger applies, and otherwise replace its body with a one-line omit reason.
- MUST delete the italic annotations before the spec is considered final.
- SHOULD keep the whole document short for a small change; right-size per [problem-and-scope.md › Right-Sizing Scope](./problem-and-scope.md#right-sizing-scope).

## Skeleton

Everything in `<…>` is a slot to fill, and everything in italics is an annotation to delete.

```markdown
## Summary

<One standalone paragraph: what this change is and the outcome it produces, graspable
without reading the rest of the document.>
_(See problem-and-scope.md → Summary.)_

## Background

<Why this change is needed: who is affected, what is broken or missing, and why it
matters — the problem before any solution.>
_(See problem-and-scope.md → Outcome Before Solution.)_

**Goals:**
- <A specific outcome this change intends to achieve.>

**Non-goals** (omit only if nothing plausible is being excluded):
- <A thing that could reasonably have been in scope, deliberately excluded, and why.>
_(See problem-and-scope.md → Non-Goals and Out-of-Scope.)_

**Assumptions** (distinct from open questions — an open question blocks planning and gets
asked instead):
- <A belief the plan relies on that the reader might disagree with.>
_(See problem-and-scope.md → Assumptions vs. Open Questions.)_

## Functional requirements
_(Conditional: include when the change alters observable behavior; otherwise replace this
section's body with a one-line reason, e.g. "Omitted — behavior-preserving refactor." See
functional-requirements.md.)_

<The observable behavior the change adds or alters, as inputs and outcomes.>

### UI design
_(Conditional subsection: include when the change is view-affected; otherwise a one-line
reason. See ui-design-framing.md for hierarchy, interaction states, accessibility intent,
responsive intent, and copy constraints.)_

### System design
_(Conditional subsection: include when the architecture-boundary OR the intricate-mechanics
trigger applies; otherwise a one-line reason. See architecture-overview-framing.md.)_

<Data flow and module boundaries at spec level — named entities and who owns which state.>

#### Alternatives considered
_(Include when a plausible competing approach exists.)_
- <A realistic alternative that was evaluated, and why it was rejected.>

## Non-functional requirements
_(Conditional: include when the change carries measurable performance/scale/security/
accessibility targets; otherwise replace the body with a one-line reason. See
architecture-overview-framing.md → Constraints and Non-Functional Requirements.)_

- <A measurable target scoped to the component it constrains, e.g. "list scroll stays at
  60fps for 500 items".>

## Acceptance criteria

- <One observable happy-path behavior, phrased so a reviewer can verify it from the
  diff or the running UI without reading implementation code.>
- <One relevant edge/disabled/empty/error-state behavior.>
- <An explicit "X is unaffected" criterion, when this change sits next to something
  that must stay untouched.>
_(See acceptance-criteria.md → Coverage and Right-Sized Checklists. Write plain bullets,
not GitHub `- [ ]` checkboxes.)_

## Verification strategy

<How each criterion is confirmed: the project checks that apply to the changed surface
(format/lint, unit, e2e, build) and the manual passes a reviewer runs — not a restatement
of the criteria. Call out any check that does not apply and why.>
_(See verification-strategy.md.)_

## Open questions

<Unresolved decisions that block confident planning — or "None" when scope is fully
settled. Distinct from assumptions.>
_(See problem-and-scope.md → Assumptions vs. Open Questions.)_
```
