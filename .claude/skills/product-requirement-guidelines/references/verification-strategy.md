# Verification Strategy

Apply this reference when drafting or reviewing the **Verification strategy** section of a spec — how the finished change will be exercised and confirmed, distinct from the acceptance criteria it confirms. In the canonical plan-document structure this section is required. Acceptance criteria state *what must be true*; the verification strategy states *how each of those truths is demonstrated* — which of the project's checks and which manual passes produce the evidence. Keeping the two apart stops a checklist of pass/fail conditions from silently absorbing the method used to reach them.

## Method, Not Restated Criteria

A verification strategy names the concrete activities that produce evidence the change works: the project's automated checks that apply to the changed surface, and the manual passes a reviewer or the author runs. It is scoped to the change — it names the surfaces at risk and the checks that exercise them, not a generic "run all tests" boilerplate.

**Guidelines:**

- MUST state the verification strategy as the activities that produce evidence — the specific project checks and manual passes — not as a restatement of the acceptance criteria.
- MUST map the strategy to the surfaces the change puts at risk, per the project's development guidelines (verification rules), rather than listing every check unconditionally.
- MUST name the project's verification commands the change requires — format/lint, unit tests, e2e/scenario-coverage, and build — per [AGENTS.md › Verification](../../../../AGENTS.md#verification), deferring the command specifics and the changed-surface-to-check mapping to the project's development guidelines rather than restating them here.
- SHOULD call out any check that does **not** apply and why (e.g. "docs-only: no unit or e2e coverage; the project has no automated docs-link check, so cross-links are verified by a manual read pass"), so a reviewer sees the gap was reasoned about, not skipped.
- SHOULD name the manual checks that automated suites cannot cover — non-default content states, not-found/error surfaces, deep-link handling, responsive layout across device sizes — when the change touches those surfaces, per the project's quality-assurance guidelines.

## Relationship to Acceptance Criteria

The two sections are complementary and both required. An acceptance criterion is judged pass or fail; the verification strategy is the plan for judging it. A criterion with no activity in the strategy that could confirm it, or a strategy step that confirms nothing in the criteria, signals the spec is out of sync with itself.

**Guidelines:**

- MUST keep every acceptance criterion reachable by some activity in the verification strategy, and every strategy activity tied to a criterion (or to the project's fixed verification gates) it confirms.
- MUST NOT duplicate the acceptance-criteria checklist here; reference it instead, and describe only the method used to confirm it.
