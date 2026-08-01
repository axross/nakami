# Known Deviations from the Installed Skills

Apply this reference when an installed capability's rule appears to conflict with this codebase, and when reviewing a change that looks like a skill violation.

Two installed rules genuinely disagree with this codebase — the query-key shape and the `common/` tier definition below. Each is a deliberate, accepted deviation, recorded here rather than silently violated. A reviewer who finds this codebase doing either has found a recorded decision, not a defect; anything else that departs from an installed rule is a finding.

The first section below is **not** a deviation. It is recorded because the directory name looks like one at a glance, and a reviewer who assumes a violation without reading the rule closely will raise a finding that is not there.

## Screen Bodies Live in `components/`, Not `screens/` — a Naming Choice, Not a Deviation

Routes here compose from `src/<feature>/components/`; this repository has no `screens/` directory. That is a departure from a stated **convention**, not from a rule.

The Expo app development capability's route-modules reference is explicit about which part binds. Its prose reads "the screen body lives in the owning domain directory — _conventionally_ `screens/` inside that domain", and its guideline is "MUST place the screen body in the owning domain's screen directory **rather than in the route file**". The force of the MUST is route-file-versus-domain-directory; the `screens/` name is marked conventional in the same sentence that introduces it.

This repository satisfies that MUST. `src/app/welcome.tsx` is a default export that renders `WelcomeScreen` from `~/auth/components/welcome-screen/welcome-screen` — the screen body sits in the owning domain's directory, and nothing but mounting lives in the route file.

**Guidelines:**

- MUST place a screen body in `src/<feature>/components/`, not in the route file.
- MUST NOT raise the absence of a `screens/` directory as a skill violation; the installed rule does not require that name.

## Two Existing Query Keys Use the Trailing-Filter Shape

`src/collections/queries/collection-list-query.ts` and `collection-records-query.ts` put tenancy in a trailing filter object — `["collections", scope]` — which the TanStack Query capability marks as a Major finding. Migrating them is tracked as issue #67; new code follows the capability rather than the precedent these two set. The query-key rule itself lives in [routing-and-data.md](./routing-and-data.md).

**Guidelines:**

- MUST NOT copy the trailing-filter key shape into new code; the tenancy-rooted form applies.
- SHOULD fold the migration of these two keys into issue #67 rather than changing them opportunistically inside an unrelated change.

## `src/common/` Holds the Payload HTTP Client, Which Carries Domain Vocabulary

The Expo app development capability's project-layout reference draws the `common/`/`core/` line by what each tier *knows*. `common/` holds "reusable UI and utility primitives that know nothing about the application", and its guideline is "MUST keep `common/` to primitives that carry no domain vocabulary and no application configuration". `core/` gets "app-wide infrastructure and the singletons the application is wired from" — with "the HTTP or query client" named as an example.

`src/common/helpers/payload-client.ts` is that HTTP client, and its exported surface — `PayloadRequestError`, `PayloadErrorKind`, `PayloadServer`, `collectionSlug` — is Payload vocabulary end to end. Under the installed rule it belongs in `src/core/`.

It sits in `src/common/` because this repository's own placement rule in [repository-map.md](./repository-map.md) decides by consumer count rather than by content — "MUST place a module used by two or more features in `src/common/`" — and `src/auth/`, `src/collections/`, and `src/core/` all consume it. Each rule is followed as written; they disagree about this one file. (Only the domain-vocabulary half is breached: the server identity is caller-supplied, so the module carries no application configuration.)

The resolution is the move already tracked as issue #89, which relocates the client into `src/core/` and removes the ratified upward-import exception at the same time. Until it lands the file stays where it is, because moving it touches every importing module and is that issue's whole content.

**Guidelines:**

- MUST NOT raise `payload-client.ts`'s placement as a fresh finding; it is recorded here and resolved by issue #89.
- MUST place a **new** cross-cutting module by the installed rule rather than by the precedent this file sets: one carrying domain vocabulary or application configuration goes to `src/core/`, whatever its consumer count.
- SHOULD leave [repository-map.md](./repository-map.md)'s consumer-count rule alone while issue #103 rewrites that file; folding the content test into it now means writing and reviewing it twice.

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
