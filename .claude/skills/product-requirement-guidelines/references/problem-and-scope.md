# Problem Framing and Scope

Apply this reference when drafting or reviewing the parts of a spec that state what is needed and why — the **Summary**, the **Background** (with Goals, Non-goals, and Assumptions), and the **Open questions** — before any UI, system-design, or implementation detail. Sourced from PRD- and requirements-writing practice: [Perforce's PRD guide](https://www.perforce.com/blog/alm/how-write-product-requirements-document-prd), [ProductPlan's problem-statement guide](https://www.productplan.com/learn/guide-to-writing-an-effective-problem-statement), [Intercom's "start with a problem statement"](https://www.intercom.com/blog/how-to-write-problem-statements/), [Product Talk on product outcomes](https://www.producttalk.org/product-outcomes/), and [Google's design-docs practice](https://www.industrialempathy.com/posts/design-docs-at-google/).

## Summary

The Summary is one standalone paragraph at the top of the spec that a reader can grasp without the rest of the document — what the change is and the outcome it produces. It is an abstract, not a table of contents: it states the result, not a walk through the sections that follow. Google's design-doc practice opens with exactly this kind of short context paragraph so a reader can decide in seconds whether to read on.

**Guidelines:**

- MUST open the spec with a one-paragraph Summary that states what the change is and the outcome it produces, readable on its own without the later sections.
- MUST keep the Summary to the result, not a description of the document's structure or a restatement of every section below it.
- SHOULD frame the Summary around the outcome per [Outcome Before Solution](#outcome-before-solution), not the artifact being shipped.

## Outcome Before Solution

A requirement earns its solution once the problem is on the page. PRD guidance converges on the same opening move: name who is affected, what is broken or missing for them, and why it matters, before naming a feature, screen, or fix. Outcome-based framing — the change in user or business behavior sought — is preferred over output-based framing (the artifact being shipped), since output-only specs risk becoming a "feature factory" that ships work without moving anything real.

**Guidelines:**

- MUST state the user-facing outcome and the problem it solves before any solution, UI, or system-design detail.
- MUST keep "how" out of this section; system design, UI mechanics, and implementation belong to their owning skills, not here.
- SHOULD frame the outcome as a change in behavior or capability, not as the artifact being built.
- SHOULD ground the problem in the underlying need it serves rather than a literal feature request, so the requirement stays stable if the chosen solution changes.

## Goals

The Background section pairs the problem with **Goals** — the specific outcomes this change intends to achieve — so the Non-goals below them read as deliberate exclusions from a stated ambition rather than an open-ended list. A goal is an outcome, not a task: "a reviewer can find the intended design without opening the issue thread" is a goal; "add a link to the PR body" is the task that serves it.

**Guidelines:**

- MUST state Goals as the outcomes the change intends to achieve, phrased as results rather than the tasks that produce them.
- SHOULD keep each goal checkable enough that a later Acceptance criterion can trace back to it, per [Concrete, Checkable Language](#concrete-checkable-language).
- SHOULD pair every Goals list with an equally visible Non-goals list below it.

## Non-Goals and Out-of-Scope

Non-goals are a decision, not a disclaimer. Design-doc practice at Google treats "Non-Goals" as things that could reasonably have been in scope but were deliberately excluded — not a restatement of the goal in the negative. Pairing every goal list with an equally visible non-goal list pre-empts "can we just add X" requests once work is underway.

**Guidelines:**

- MUST write explicit non-goals or out-of-scope bullets whenever the boundary is easy to misread.
- MUST phrase each non-goal as a deliberate exclusion of something that could plausibly have been included, not as a negated goal.
- SHOULD route a later request that falls outside the stated non-goals through explicit scope evaluation rather than silently absorbing it into the current change.

## Assumptions vs. Open Questions

Assumptions and open questions are easy to conflate but serve different readers. An assumption is a stated belief the plan relies on and would need to revisit if wrong; an open question is an unresolved item that blocks confident planning until answered.

The two live in different sections of the canonical structure: assumptions sit under **Background**, while unresolved decisions collect in the required **Open questions** section at the end. Open questions is required precisely so a spec cannot hide an unresolved decision by omitting the section — when nothing is outstanding, it says "None" and why, rather than disappearing.

**Guidelines:**

- MUST state assumptions and constraints the plan relies on under Background, distinct from open questions.
- MUST NOT embed an unresolved product, scope, or platform decision silently as an assumption; move it to Open questions and ask it, per AGENTS.md's rule to ask a concrete question when progress depends on a product, platform, privacy, compatibility, or scope decision.
- MUST keep the Open questions section present even when empty — state "None" with a short reason (e.g. "scope is fully settled") rather than dropping the section.
- SHOULD flag an assumption the reader is likely to disagree with rather than build around it unstated.
- SHOULD promote an assumption to an open question once the plan's correctness genuinely depends on it being right.

## Right-Sizing Scope

Formality tracks risk and reversibility, not a fixed template. Cross-team, irreversible, or high-blast-radius changes warrant a fuller spec with alternatives and non-goals; a small, easily reversible change warrants a short paragraph. Shape Up's appetite-first approach — fixing the time or resource budget and shaping scope to fit it — is a disciplined way to right-size scope instead of letting an open-ended feature list dictate it.

**Guidelines:**

- MUST right-size the section to the change: a one-line copy fix needs a short paragraph, not a multi-heading spec; a cross-cutting feature needs more.
- SHOULD add detail only as decisions stabilize rather than speculatively covering capabilities not yet needed.
- SHOULD scale formality to the change's risk and reversibility, not to a fixed section template.

## Concrete, Checkable Language

Vague quality adjectives are a measured defect, not a style nitpick: empirical requirements-smell research ties subjective terms like "user-friendly," "fast," "intuitive," or "seamless" directly to lower testability and higher downstream defect risk. Classic requirements guidance names the same failure mode as words to avoid without a measurable follow-up.

**Guidelines:**

- MUST replace vague quality adjectives ("user-friendly", "fast", "intuitive", "clean", "seamless") with concrete, checkable statements.
- MUST keep each requirement to one thing with only one reasonable interpretation (atomic: one requirement, one interpretation).
- MUST name the exact copy, threshold, attribute, or state transition expected instead of describing a quality in the abstract.
