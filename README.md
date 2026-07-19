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
| `SENTRY_AUTH_TOKEN` | Authorizes Sentry source-map upload during builds (incl. the Fastlane Android preview build) |
| `CLAUDE_CODE_OAUTH_TOKEN` | The `@claude review` CI reviewer (add when enabling it) |
| `ANDROID_KEYSTORE_BASE64` | base64 of the release keystore (`.jks`) used to sign the Android preview build |
| `ANDROID_KEYSTORE_PASSWORD` / `ANDROID_KEY_ALIAS` / `ANDROID_KEY_PASSWORD` | Release keystore credentials for signing |
| `FIREBASE_ANDROID_APP_ID` | Firebase Android app id (`1:…:android:…`) the preview APK is distributed to |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Service-account JSON authorizing the Firebase App Distribution upload |

An optional repo **variable** `FIREBASE_GROUPS` (comma-separated Firebase tester
group names) targets the distribution at specific tester groups.

Builds started outside GitHub Actions (e.g. `eas build` locally or EAS's own
CI) do not see Actions secrets — mirror `SENTRY_AUTH_TOKEN` as an EAS
environment variable for those.

## Expo MCP

The [Expo MCP server](https://docs.expo.dev/mcp/) gives AI-assisted tooling
live access to Expo: on-demand documentation and SDK guidance, EAS build and
workflow state, and TestFlight crash/feedback data. With a local dev server it
also unlocks **local capabilities** — simulator automation, React Native
DevTools, and project analysis. It complements the enabled
`expo@claude-plugins-official` Claude Code plugin: the plugin teaches static
known-good Expo patterns, while the MCP server provides live project and EAS
access.

[`.mcp.json`](./.mcp.json) registers the remote server for **Claude Code**
(project scope, checked in). Other clients (VS Code, Cursor, Codex) are not
wired up here — connect them with the per-client commands in the
[Expo MCP docs](https://docs.expo.dev/mcp/).

### Authenticate with `EXPO_TOKEN`

The server requires an **Expo account**. Instead of the interactive OAuth
browser flow (which cannot complete in a Claude Code cloud/web session), this
repo authenticates with a **personal access token** sent in the `Authorization`
header. `.mcp.json` references `${EXPO_TOKEN}` only — **the token is never
committed**.

1. Generate a **dedicated** token at
   [Expo → Access tokens](https://expo.dev/settings/access-tokens) (Personal
   access tokens → Create token).
2. Make it available as a real environment variable named `EXPO_TOKEN`:
   - **Claude Code on the web (cloud):** add `EXPO_TOKEN` to your
     [environment's variables](https://code.claude.com/docs/en/claude-code-on-the-web#configure-your-environment).
   - **Desktop / terminal:** export it from your shell profile
     (`export EXPO_TOKEN=…`). Note: `.env` / `.env.local` files are **not**
     auto-loaded into the MCP header expansion, so a value placed only in a
     `.env` file will not be picked up — it must be an exported env var.
3. In Claude Code, approve the project MCP server on first use; run `/mcp` to
   check the connection.

> **Security.** Claude Code cloud environments have no dedicated secrets store —
> environment variables are visible to anyone who can edit the environment, and
> an Expo token grants account access. Use a dedicated token (not a shared/CI
> one), keep it in a **personal** environment, rotate it periodically, and
> revoke it from the EAS dashboard if it leaks.

### Local capabilities

Run the dev server with local MCP capabilities enabled:

```sh
npm run dev:mcp   # EXPO_UNSTABLE_MCP_SERVER=1 expo start
```

Reconnect the MCP server after starting or stopping the dev server so the local
tools register. Requires Expo SDK 54+ (this project is on SDK 57).

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
([`merge-checks.yaml`](./.github/workflows/merge-checks.yaml)), which runs on
every PR update as four independent, parallel jobs — **Lint** (Biome), **Typecheck**
(TypeScript), **Unit Tests** (Jest), and **E2E Scenario Coverage** — so a red
check names exactly one failing tool.

> Branch protection: the `Lint` and `Unit Tests` check names are unchanged, but
> `Typecheck` and `E2E Scenario Coverage` are now **separate** checks (they used
> to be bundled into `Lint` and `Unit Tests` respectively). To keep gating merges
> on them, add both to the required status checks under
> Settings → Branches → branch protection for `main`.

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

## Preview builds

Per-PR Android preview builds are produced on demand by
[`android-build.yml`](./.github/workflows/android-build.yml) — a
**manually-dispatched** Fastlane workflow, not a merge gate and not tied to
`pull_request` events. Dispatch it when a PR looks ready for merge to get a
signed, installable APK distributed via **Firebase App Distribution**, so a
human can verify the change on a physical device before merging.

- **How to run it:** from the Actions tab (**Run workflow** → pick the PR's
  branch), via `gh workflow run android-build.yml --ref <branch> -f pr=<number>`,
  or from an agent. The optional `pr` input makes the workflow comment the
  install link back on that PR; the link always appears in the run summary.
- **Three jobs:** `prebuild` runs `expo prebuild` and caches the generated
  `android/` project keyed by a checksum of `app.json` + `package-lock.json`
  (skipped on a cache hit), handing it to `build_android` via an artifact;
  `build_android` signs the release APK and uploads it to Firebase; and `report`
  writes the install link to the run summary and, when the `pr` input is given,
  comments it on that PR. Requires the `ANDROID_*`, `FIREBASE_*`, and
  `SENTRY_AUTH_TOKEN` secrets above.
- **Not a merge blocker (by design):** merges are gated only by the checks in
  `merge-checks.yaml`. On-device sign-off on a preview build is a manual,
  human-in-the-loop step before merging.

Store/production builds and on-demand dev clients remain on EAS
([`release-internal.yml`](./.eas/workflows/release-internal.yml),
[`dev-client.yml`](./.eas/workflows/dev-client.yml)).

## Related links

<!-- Add project links here as they come to exist — docs, issue tracker,
deployment dashboard, design files. -->
