# Visual Design Options

Apply this reference during `/address` Phase 1 whenever the run's work is UI-bearing. It defines how the plan's UI design section presents visual presentation options for the human to choose from, how each round's published Artifact serves as the design source of truth with an account-free fallback recorded in the tracking issue, and how the chosen design stays findable through code review and later verification of the running app. The spec-level *content* of a UI design section — hierarchy, states, accessibility, responsive intent — stays owned by the project's product requirement guidelines, and design-system vocabulary — tokens, theming, component composition — stays owned by the project's component guidelines; this reference owns only the options exhibit and its lifecycle.

## When the Exhibit Is Required

The exhibit triggers on the *visual axis* of the Response Approach's UI-bearing classification: it is required when what a person sees changes in shape, arrangement, or treatment on any human-facing surface of the app — screens (routes), components, navigation, and interactive states (layout, hierarchy, styling, imagery, motion). A plan can be UI-bearing without triggering the exhibit: pure copy rewording inside an unchanged layout still needs the UI design section's copy constraints, but presents no visual directions to choose between. Nothing-visual changes — implementation-only refactors, data or content edits, behavior-only fixes with unchanged rendering — never trigger it.

**Guidelines:**

- MUST present the options exhibit for every plan whose work changes visual presentation — shape, arrangement, or treatment — regardless of how small the change is: a spacing or color tweak still gets three directions, scaled down (three small sketches, a line of rationale each).
- SHOULD treat a change as visually-presenting when in doubt; a superfluous exhibit costs minutes, while an unchosen design costs a review round.
- MUST state the exhibit decision in the plan either way: the UI design section opens the exhibit when the trigger is met, and otherwise records why the exhibit is omitted (no visual change, or a UI design section omitted entirely for non-UI work) — so the reviewer sees the decision was made deliberately, not skipped.

## Two Kinds of Design Round

Every design round is either an **options round** or a **confirmation round**, and which of the two applies is set by **what the human asked to see**, not merely by whether a direction has already been picked:

- An **options round** presents at least three distinct candidates for the human to choose between (see [Constructing the Options](#constructing-the-options)). It covers the first design round (always at wireframe fidelity, per [Wireframe Round](#wireframe-round)) **and** any later round the human opens by asking to see candidates, examples, options, or alternatives at a fidelity or comparison axis not yet decided — even after they picked a direction at a lower fidelity. Asking to "see hi-fi examples" of a direction chosen only as a wireframe re-opens the decision at a fidelity the human has not yet compared, so it is an options round.
- A **confirmation round** renders a single already-approved direction to confirm it (see [High-Fidelity Round](#high-fidelity-round)). A round is a confirmation **only when** it renders the exact direction the human already approved **and** no new fidelity or comparison decision is being requested.

**Guidelines:**

- MUST classify a round as options-or-confirmation by what the human asked for: a request to compare candidates, examples, options, or alternatives at a fidelity or axis not yet decided is an options round (at least three candidates), regardless of whether a direction was already chosen at a lower fidelity.
- MUST treat a round as a confirmation only when it renders the exact already-approved direction and no new fidelity or comparison decision is on the table.
- MUST, when in doubt whether a round is options or confirmation, present at least three candidates. A superfluous option costs minutes; a missing one costs a round.

## Constructing the Options

These rules govern an *options round*; see [Two Kinds of Design Round](#two-kinds-of-design-round) for what makes a round an options round rather than a confirmation round. Three options exist to give the human a real decision, so distinctness is the quality bar: options that vary only accent color or corner radius are one design shown three times.

**Example (option skeleton inside the UI design section):**

```markdown
#### Option B — Split header (Recommended)

<sketch: fenced ASCII wireframe or Mermaid diagram; reference the round's Artifact URL beside it>

Rationale: … (why this direction serves the requirement; why it is recommended)
Trade-offs: … (what it costs relative to Options A and C)
```

**Guidelines:**

- MUST present at least three options in every options round, labeled sequentially (`Option A — <short name>`, `Option B — …`), each differing in at least one structural axis — hierarchy, layout, or visual treatment — not merely in decoration.
- MUST give every option a sketch, a rationale of a few sentences, and its trade-offs relative to the other options.
- MUST mark exactly one option **(Recommended)** in its heading and justify the recommendation in its rationale.
- MUST ground every option in the project's design system per the project's component guidelines — the design tokens in `src/common/constants/style.ts` (colors, gap, radius, and font sizes), Unistyles theming, and identical light/dark token shapes; an option that violates the design system is not a valid choice.
- MUST NOT pad the exhibit with a straw-man; every option must be one the run could genuinely implement.
- SHOULD keep each option compact enough to compare side by side — a heading, a sketch, and a handful of sentences.
- SHOULD note per option any accessibility or responsive implication that materially distinguishes it; the full accessibility and responsive intent is written for the chosen direction per the project's product requirement guidelines once the choice lands.

## Presenting Designs as Artifacts

Every design round — wireframe and high fidelity alike — is shown to the human as a published **Artifact** (the harness's hosted-page feature; in Claude Code, the `Artifact` tool), so the human sees the design rendered rather than reading a raw sketch. That published Artifact is the round's **design source of truth** — the durable, canonical record of the intended design. Because an Artifact is a private-by-default page that the independent reviewer's separate session and later agent sessions cannot open without a claude.ai account, every round also carries an **account-free fallback** embedded directly in the tracking issue — the round's ASCII/Mermaid wireframe (see [Wireframe Round](#wireframe-round)) — so a reviewer or on-device-verifying agent still sees the intended layout. The two always travel together: publish the Artifact as the source of truth, and keep the account-free fallback in the issue.

**Guidelines:**

- MUST present every design round as a published Artifact — at both wireframe and high fidelity, for options rounds and confirmation rounds alike — as the round's design source of truth, and consult the harness's artifact-design guidance (in Claude Code, the `artifact-design` skill) before building the page.
- MUST shape the Artifact to the round: an options round renders its at-least-three candidates so they compare side by side, each labeled and carrying its rationale and trade-offs; a confirmation round renders the single already-approved direction. Cover both light and dark themes and the device sizes where the design differs, and hold a wireframe Artifact to the same breadboard fidelity as its embedded sketch — regions, hierarchy, flow, not colors or final type.
- MUST keep the account-free fallback in the GitHub issue alongside every Artifact: embed the round's ASCII/Mermaid wireframe in the UI design section and reference the Artifact URL next to it. An Artifact link alone does not satisfy the recording rules — the reviewer bot and later agent sessions must be able to see the intended layout without a claude.ai account.
- MUST NOT treat publishing or viewing the Artifact as design approval; the plan-approval gate always runs against the design recorded in the issue, per [Recording the Choice and Revisions](#recording-the-choice-and-revisions).

## Wireframe Round

The first options round is always at wireframe fidelity. A wireframe shows places, affordances, and flow — regions and their arrangement — not fonts, exact spacing, or final copy.

**Example (one option's sketch):**

```
+----------------------------+
| ‹ back        screen title |
+----------------------------+
| summary card               |
+----------------------------+
| list item                  |
| list item                  |
| list item                  |
+----------------------------+
| [ primary action ]         |
+----------------------------+
```

**Guidelines:**

- MUST embed every wireframe directly in the issue body, inside the UI design section, in a form GitHub renders without attachments: an ASCII sketch in a fenced code block or a Mermaid diagram (`flowchart` or `block-beta`), whichever draws the layout more clearly. This embedded sketch is the round's account-free fallback; also publish the wireframe as an Artifact — the round's design source of truth — per [Presenting Designs as Artifacts](#presenting-designs-as-artifacts).
- MUST keep wireframes at breadboard fidelity — regions, hierarchy, flow — in both the embedded sketch and the Artifact; MUST NOT spend the wireframe round on colors, exact typography, or final copy.
- SHOULD add a one-line note per option on how its layout adapts across device sizes (small phones, large phones, tablets) when the options genuinely differ there.
- MUST run the first design round at wireframe fidelity and MUST NOT skip straight to a high-fidelity options round, even when the structural/layout pattern is already fixed (for example, the change restyles an existing arrangement) and the design-system/component context pins down what high fidelity looks like. The embedded wireframe is the durable account-free record every later round's fallback depends on, so it is always produced first — an Artifact-only high-fidelity round would leave a reviewer or agent session without a claude.ai account with no account-free view of the design.

## High-Fidelity Round

After the human decides the wireframe-level direction, the run renders the direction at high fidelity, presented the same way: published as an Artifact (the design source of truth), recorded in the issue, decided through the plan-approval gate. The default ladder is a **wireframe options round (at least three) → pick a direction → high-fidelity confirmation (one render of the chosen direction)**. But the high-fidelity round is equally a first-class **options round** — at least three rendered candidates — when the human wants to compare the real treatment (type, color, spacing, density) across directions before committing; wireframes deliberately hide exactly those, so this is often the fidelity where the comparison matters most. Which shape a given high-fidelity round takes follows [Two Kinds of Design Round](#two-kinds-of-design-round). The high-fidelity design is built and published as an Artifact — its canonical record — without touching the repository; the issue's account-free fallback stays the round's ASCII/Mermaid wireframe, so a reviewer or later agent session without a claude.ai account still sees the layout. There is no human upload step:

1. Build the mockup as a self-contained page in a scratch location outside the repository checkout (the harness scratchpad), following the harness's artifact-design guidance, covering both themes and the device sizes where the design differs.
2. Publish it as an Artifact (in Claude Code, the `Artifact` tool) and present it to the human — this published Artifact is the round's design source of truth.
3. Reference the Artifact URL from the UI design section under the option it belongs to, keeping the round's ASCII/Mermaid wireframe embedded in the issue as the account-free fallback, then re-enter the plan-approval gate.

**Guidelines:**

- MUST carry the high-fidelity design as a published Artifact (its source of truth) plus the round's in-issue ASCII/Mermaid wireframe (the account-free fallback); MUST NOT commit design mockups or renders to the repository on any branch, and MUST NOT leave mockup or render files in the working tree. (The published Artifact is a hosted page, not a repository file — publishing it is expected and is not a repository commit.)
- MUST reference the round's Artifact URL from the issue's UI design section under its option heading, alongside the account-free wireframe fallback; an Artifact only shown in chat, or published but never referenced from the issue, does not count as presented.
- MUST re-enter the plan-approval gate once the round is recorded in the issue — high fidelity exists to be approved, not merely displayed.
- MUST, at the wireframe-approval gate, tell the human that the next round will confirm the single chosen direction at high fidelity, and offer the alternative of a high-fidelity options round (at least three rendered candidates) — so the human opts into a single confirmation knowingly rather than by silent default.
- MUST run the high-fidelity round as an options round (at least three rendered candidates, one marked `(Recommended)`, per [Constructing the Options](#constructing-the-options)) whenever the human asks to compare directions, candidates, or examples at high fidelity — even after choosing a direction at wireframe fidelity — and record and approve the choice by the same rules as any options round.
- MUST present a confirmation round — one that renders an already-decided direction with no new fidelity or comparison decision requested — as that direction's renderings only: one faithful rendering per meaningful variant, no new options, no `(Recommended)` marker; bare `/address continue` approves the confirmation.
- SHOULD render at least the chosen (or recommended) option in both light and dark themes, and at the device sizes where its layout changes, per the project's component guidelines theming rules.

## Recording the Choice and Revisions

The issue records the design decision, its history, and the account-free wireframe fallback, so it stays the recovery point for anyone without a claude.ai account. Anyone — the maintainer, the independent reviewer, a later agent session verifying the app on a simulator — must be able to open the issue and see the current design (its Artifact URL and the in-issue wireframe), how it was chosen, and what it replaced.

**Guidelines:**

- MUST record the outcome of every design round in the UI design section when the human approves it: mark that round's chosen option (`**Chosen:** Option B — <name>`) and keep its embedded ASCII/Mermaid wireframe (the account-free fallback) as the section's current design, with the round's Artifact URL — the design source of truth — referenced beside it — so both the wireframe round's selection and the high-fidelity round's selection each leave a durable per-round record.
- MUST update the UI design section in place on every design revision during the plan phase, so the section always shows the current design state.
- MUST move superseded options and rounds into one collapsed `<details>` subsection titled `Design history` inside the UI design section, labeled by round (`Round 1 — wireframes`, `Round 2 — high fidelity`), and MUST NOT delete them.
- MUST keep the run's status block current with the pending design state (for example, `awaiting plan approval (design round 2: high fidelity)`).
- MUST re-enter the plan-approval gate after every plan-phase revision: update the issue first, then stop and wait for `/address continue`.
- MUST apply these same recording rules when a design revision arises after the pull request exists (for example, from human review comments): update the issue's UI design section in place, preserve the history, re-publish the Artifact so the linked page matches the current design, refresh the pull request's design links (its Artifact URL and account-free wireframe fallback) — and run the change as a Phase 4 round (back to draft if flipped, fresh independent review) rather than a plan-phase stop.

## Design Links in the Pull Request

Code review checks the diff against the intended design; on-device and e2e verification checks the running app against it. Both need the design without excavating the issue thread.

**Guidelines:**

- MUST link the chosen design from the pull request description when the plan presented the options exhibit: the tracking issue's UI design section, and — for both fidelities that ran — each round's Artifact URL (the design source of truth) alongside its in-issue ASCII/Mermaid wireframe (the account-free fallback), so a reviewer reaches the intended design at either fidelity without excavating the issue thread. A plan whose exhibit was legitimately omitted has no design to link, and this section does not apply.
- MUST name the chosen option in the pull request body (for example, `Implements Option B — <name> from #<issue>`) so the reviewer knows which direction to hold the diff against.
- MUST update those links whenever a later design revision changes the chosen design after the pull request exists.
