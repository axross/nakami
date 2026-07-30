# Known Deviations from the Installed Skills

Apply this reference when an installed capability's rule appears to conflict with this codebase, and when reviewing a change that looks like a skill violation.

Two installed rules disagree with this codebase. Both are deliberate, accepted deviations, recorded here rather than silently violated — and neither is sanctioned by an escape hatch in the skill it departs from. A reviewer who finds this codebase doing one of these two things has found a recorded decision, not a defect; anything else that departs from an installed rule is a finding.

## Screen Bodies Live in `components/`, Not `screens/`

The Expo app development capability's route-modules reference states a MUST: the screen body belongs in the owning domain's `screens/` directory. This repository has no `screens/` — routes compose from `src/<feature>/components/`. Follow this repository.

Worth knowing why this one is a standing violation rather than a permitted variation. That capability carries **no** general "existing convention wins" carve-out, unlike the TanStack Query and React component development capabilities, which do. Its established-convention allowances are each scoped to a single subject — the source-root name, the path alias, and the safe-area inset mechanism — and none of them reaches the screen-body rule.

**Guidelines:**

- MUST place a screen body in `src/<feature>/components/`, not in a `screens/` directory.
- MUST NOT read this deviation as a general licence to override the capability's other MUST rules; it is scoped to screen-body placement alone.
- SHOULD revisit the deviation if the cost of diverging grows — it is accepted, not settled forever.

## Two Existing Query Keys Use the Trailing-Filter Shape

`src/collections/queries/collection-list-query.ts` and `collection-records-query.ts` put tenancy in a trailing filter object — `["collections", scope]` — which the TanStack Query capability marks as a Major finding. Migrating them is tracked as issue #67; new code follows the capability rather than the precedent these two set. The query-key rule itself lives in [routing-and-data.md](./routing-and-data.md).

**Guidelines:**

- MUST NOT copy the trailing-filter key shape into new code; the tenancy-rooted form applies.
- SHOULD fold the migration of these two keys into issue #67 rather than changing them opportunistically inside an unrelated change.

## Recording a New Deviation or Gap

Two different things send you to this file, and they resolve the same way. A **deviation** is a collision — an installed capability requires one thing, this repository does another. A **gap** is an installed capability being wrong, outdated, or simply silent on a case this repository hits. Either way the installed skill is left exactly as it is, and the resolution is written down here.

That matters because an unrecorded deviation reads to the next agent, and to the CI reviewer, as a plain violation of a MUST rule; and an unrecorded gap gets rediscovered from scratch by whoever hits it next.

Editing the installed copy is never how either is resolved. Every skill under `.claude/skills/` except this one is installed from [`axross/skills`](https://github.com/axross/skills), and the next reinstall overwrites a hand-edit without reporting it — so the change is lost, and until it is lost it poses as a rule the library agrees with.

**Guidelines:**

- MUST NOT edit an installed skill to fix a rule that is wrong, outdated, or missing; the edit does not survive a reinstall and misrepresents the library until it is discarded.
- MUST record a new deviation here — the rule, the capability it departs from, and why the deviation was accepted — rather than violating an installed skill silently.
- MUST resolve a gap in an installed capability by one or both of the two available routes: an issue opened on the upstream library when the gap generalizes beyond this project, and a written note here (or in `CLAUDE.md`) saying what the capability says, what this repository does instead, and how to handle the case meanwhile.
- MUST obtain the human's go-ahead before opening an upstream issue — it is a public write on a repository this project does not own — and MUST record the gap locally in the meantime rather than leaving the finding to depend on that issue landing.
- MUST continue the task that exposed the finding under the skill exactly as installed; routing a change never blocks the work, and never licenses acting as though the proposed rule were already in force.
- SHOULD name any upstream issue filed or left pending in the work's completion report, so the finding outlives the session that produced it.
