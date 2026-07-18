# payload-mobile

A companion mobile app for Payload MCP, built for iOS and Android with Expo
(React Native). The repository is newly initialized: the toolchain, testing
setup, and agent working agreement are in place, and product features land as
feature directories under `src/`.

## Tech stack

| Area | Tool |
| ---- | ---- |
| Language | TypeScript |
| App framework / runtime | Expo (React Native) with Expo Router |
| Package manager | npm |
| Linting & formatting | Biome |
| State management | Zustand (client state) + TanStack Query (async/server cache) |
| Data layer | Drizzle ORM over expo-sqlite (on-device) |
| Validation | Zod |
| Styling / theming | react-native-unistyles |
| Unit tests | Jest (jest-expo) with React Native Testing Library |
| E2E tests | Maestro, with a scenario-coverage gate |
| Error tracking | Sentry (`@sentry/react-native`) |
| Logging | react-native-logs |
| Hosting | EAS (Expo Application Services) |

## Getting started

1. Use the Node version pinned in `.nvmrc` (Node 22).
2. Install dependencies: `npm install`
3. Optional: copy `.env.example` to `.env.local` for machine-local overrides.
   The committed `.env` already carries the public Sentry DSN
   (`axross/payload-mobile` on sentry.io); dev builds never send events.
4. Start developing: `npm run dev`, then connect a dev build — or compile and
   launch one with `npm run ios` / `npm run android`.
5. Export release-shaped JS bundles: `npm run build`. Release binaries are
   built with EAS Build.

## Service links and secrets

The app is linked to Sentry (`axross/payload-mobile`, DSN committed in
`.env`) and EAS (project `98f3d55e-93ca-4b3c-8564-adca02d5325c`, profiles in
`eas.json`). Secrets configured as GitHub Actions secrets:

| Secret | Used for |
| ------ | -------- |
| `SENTRY_ORG` / `SENTRY_PROJECT` | sentry-cli / source-map tooling in any workflow that builds the app |
| `SENTRY_AUTH_TOKEN` | Authorizes Sentry source-map upload during builds |
| `CLAUDE_CODE_OAUTH_TOKEN` | The `@claude review` CI reviewer (add when enabling it) |

Builds started outside GitHub Actions (e.g. `eas build` locally or EAS's own
CI) do not see Actions secrets — mirror `SENTRY_AUTH_TOKEN` as an EAS
environment variable for those.

## Development workflow

Development in this repository is agent-assisted via
[Claude Code](https://claude.com/claude-code). The working agreement lives in
[`AGENTS.md`](./AGENTS.md) (loaded through `CLAUDE.md`) and routes to the
detailed skills under [`.claude/skills/`](./.claude/skills). Human and agent
contributors follow the same loop: plan → implement → self-review → verify →
report.

### `/address` — deliver a unit of work end-to-end

[`/address`](./.claude/skills/address/SKILL.md) is the main delivery entry point.
It takes one unit of work — a GitHub issue, a pull request, or a free-form
prompt — from intake to a merge-ready pull request in a single continuing
session:

1. **Plan** — reads the issue and its thread, asks you the product and scope
   questions the spec leaves open, and rewrites the issue body into a
   reviewable plan with acceptance criteria. It then **always pauses for your
   approval**: it verifies nothing gets built until you review the plan and
   send `/address continue`.
2. **Code + verify** — implements the approved plan (on a separate worktree
   unless it is running in a Claude Code cloud environment, so it never blocks
   your working copy) on an agent-namespaced branch, runs the checks the
   changed surface requires, and self-reviews the diff.
3. **Independent review** — opens a draft pull request and requests the CI
   reviewer, a separate bot session, so the code's author never certifies its
   own work.
4. **Address** — fixes review findings and CI failures, tying each resolved
   thread to the resolving commit, for up to eight rounds.
5. **Ready** — flips the pull request to ready once CI is green and the review
   is clean. Merging always stays a human decision.

Practical examples:

```text
/address https://github.com/axross/payload-mobile/issues/42   # deliver issue #42 end-to-end
/address 57                                        # resume delivery of open PR #57
/address The 404 page should link back home        # no issue yet: files a tracking
                                                   #   issue, then delivers it
/address continue                                  # approve a paused plan, or resume
                                                   #   after you answer a question,
                                                   #   leave PR comments, or start a
                                                   #   fresh session from a /handoff
                                                   #   package
```

Every run pauses after the plan for your approval, and pauses again whenever it
genuinely needs a human — an ambiguous requirement, a judgment call on
conflicting changes — and `/address continue` picks it back up where it
stopped.

### `@claude review` — get findings on any PR

Comment **`@claude review`** on a pull request to run this repository's review
policy ([`REVIEW.md`](./REVIEW.md)) — severity-tagged findings with `file:line`
evidence and concrete fixes, posted as inline comments by the CI reviewer
([`claude-review.yaml`](./.github/workflows/claude-review.yaml)). Use it for a
pre-merge check on a hand-written change or a second opinion before merging; the
same review runs automatically against `/address` pull requests.

### `/handoff` — suspend work for another session

[`/handoff`](./.claude/skills/handoff/SKILL.md) packages in-progress work — goal,
current state, remaining to-dos, uncommitted changes — into a downloadable
`handoff-<epoch>.md` (plus an optional zip of supporting files). Use it when a
session is running low on context, or to park work for later; a fresh session
(yours or a teammate's) takes the package over with `/address continue`.

Changes made without an agent follow the same bar: branch, implement, run the
checks below, open a pull request, and get it reviewed before merge.

## Testing

Unit tests (Jest via jest-expo, colocated with their subject) cover helpers,
schemas, and component behavior; Maestro flows in `e2e/` assert whole user
journeys on a simulator, tracked against the journey catalog in
`e2e/scenarios.md`. Merges are gated by CI
([`merge-checks.yaml`](./.github/workflows/merge-checks.yaml)): Biome
lint/format, TypeScript typecheck, the unit suite, and the e2e
scenario-coverage gate.

| Check | Command |
| ----- | ------- |
| Format | `npm run format` |
| Lint | `npm run lint` |
| Type-check | `npm run typecheck` |
| Unit tests | `npm run test:unit` |
| E2E tests | `npm run test:e2e` |
| E2E scenario coverage only | `npm run test:e2e:coverage` |

Run format + lint after every change, and the suites relevant to the changed
surface before opening a pull request — see the Verification section of
[`AGENTS.md`](./AGENTS.md).

## Related links

<!-- Add project links here as they come to exist — docs, issue tracker,
deployment dashboard, design files. -->
