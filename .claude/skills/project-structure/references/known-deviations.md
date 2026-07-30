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

## Recording a New Deviation

A collision between an installed capability and this repository is resolved in this repository's favor, but never silently: an unrecorded deviation reads to the next agent, and to the CI reviewer, as a plain violation of a MUST rule.

**Guidelines:**

- MUST record a new collision here — the rule, the capability it departs from, and why the deviation was accepted — rather than violating an installed skill silently.
- MUST route a rule that belongs upstream to a feature request against the skill library instead, per the agent skill management capability; a deviation is for what only this repository can decide.
