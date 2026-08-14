# Nakami

A companion mobile app for Payload CMS, built for iOS and Android with Expo (React Native). The repository is newly initialized: the toolchain, testing setup, and agent working agreement are in place, and product features land as feature directories under `src/`.

## Trademarks

Nakami is an independent, third-party client and is not affiliated with, endorsed by, or sponsored by Payload CMS, Inc. or Figma. Payload, the Payload design, and related marks are trademarks or registered trademarks of Payload CMS, Inc. in the U.S. and other countries. References to "Payload CMS" in this project are nominative — they describe the platform Nakami connects to.

## Tech stack

| Area                    | Tool                                                         |
| ----------------------- | ------------------------------------------------------------ |
| Language                | TypeScript                                                   |
| App framework / runtime | Expo (React Native) with Expo Router                         |
| Package manager         | npm                                                          |
| Linting & formatting    | Biome                                                        |
| State management        | Zustand (client state) + TanStack Query (async/server cache) |
| Data layer              | Drizzle ORM over expo-sqlite (on-device)                     |
| Validation              | Zod                                                          |
| Styling / theming       | react-native-unistyles                                       |
| Unit tests              | Jest (jest-expo) with React Native Testing Library           |
| E2E tests               | Maestro, with a scenario-coverage gate                       |
| Error tracking          | Sentry (`@sentry/react-native`)                              |
| Logging                 | react-native-logs                                            |
| Builds & distribution   | GitHub Actions + Fastlane → Firebase App Distribution (Android) |

## Getting started

1. Use Node 22 (the version specified in the CI workflows).
2. Install dependencies: `npm install`
3. Optional: copy `.env.example` to `.env.local` for machine-local overrides. The committed `.env` already carries the public Sentry DSN (`axross/payload-mobile` on sentry.io); dev builds never send events.
4. Start developing: `npm run dev`, then connect a dev build — or compile and launch one with `npm run ios` / `npm run android`.
5. Export release-shaped JS bundles: `npm run build`. Signed, installable Android builds come from the Fastlane preview workflow ([`android-build.yml`](./.github/workflows/android-build.yml)); no store or iOS release pipeline is configured yet.

## Service links and secrets

The app is linked to Sentry (`axross/payload-mobile`, DSN committed in `.env`). Secrets configured as GitHub Actions secrets:

| Secret                                                                     | Used for                                                                                     |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `SENTRY_ORG` / `SENTRY_PROJECT`                                            | sentry-cli / source-map tooling in any workflow that builds the app                          |
| `SENTRY_AUTH_TOKEN`                                                        | Authorizes Sentry source-map upload during builds (incl. the Fastlane Android preview build) |
| `CLAUDE_CODE_OAUTH_TOKEN`                                                  | The `@claude review` CI reviewer (add when enabling it)                                      |
| `CLAUDE_OTEL_EXPORTER_OTLP_HEADERS`                                        | Authorizes the review session's OpenTelemetry export to Grafana Cloud. Scope the access-policy token to `metrics:write` and `logs:write` only — the review session's own shell can read any job-level value. Optional; unset, telemetry is off. |
| `ANDROID_KEYSTORE_BASE64`                                                  | base64 of the release keystore (`.jks`) used to sign the Android preview build               |
| `ANDROID_KEYSTORE_PASSWORD` / `ANDROID_KEY_ALIAS` / `ANDROID_KEY_PASSWORD` | Release keystore credentials for signing                                                     |
| `FIREBASE_SERVICE_ACCOUNT_JSON`                                            | Service-account JSON authorizing the Firebase App Distribution upload                        |

Repo **variables** (Settings → Secrets and variables → Actions → Variables), not secrets:

| Variable                 | Used for                                                                                                                                                                                    |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FIREBASE_ANDROID_APP_ID` | Firebase Android app id (`1:…:android:…`) the preview APK is distributed to. A **variable, not a secret**, so the tester install link (which embeds the app id) is not redacted out of the run summary / PR comment. |
| `FIREBASE_GROUPS` (optional) | Comma-separated Firebase tester group names to target the distribution at specific groups.                                                                                              |
| `CLAUDE_OTEL_EXPORTER_OTLP_ENDPOINT` (optional) | Grafana Cloud's OTLP endpoint, which the review workflow ([`claude-review.yml`](./.github/workflows/claude-review.yml)) exports Claude Code's own usage metrics and events to. This variable is the enablement switch: unset, no exporter starts and the reviewer behaves exactly as it does without telemetry. A **variable, not a secret**, so it stays readable in the workflow file's resolved configuration; the credential lives in `CLAUDE_OTEL_EXPORTER_OTLP_HEADERS` above. |

## Expo MCP

The [Expo MCP server](https://docs.expo.dev/mcp/) gives AI-assisted tooling live access to Expo: on-demand documentation and SDK guidance. With a local dev server it also unlocks **local capabilities** — simulator automation, React Native DevTools, and project analysis. It complements the enabled `expo@claude-plugins-official` Claude Code plugin: the plugin teaches static known-good Expo patterns, while the MCP server provides live docs and project access.

[`.mcp.json`](./.mcp.json) registers the remote server for **Claude Code** (project scope, checked in). Other clients (VS Code, Cursor, Codex) are not wired up here — connect them with the per-client commands in the [Expo MCP docs](https://docs.expo.dev/mcp/).

### Authenticate with `EXPO_TOKEN`

The server requires an **Expo account**. Instead of the interactive OAuth browser flow (which cannot complete in a Claude Code cloud/web session), this repo authenticates with a **personal access token** sent in the `Authorization` header. `.mcp.json` references `${EXPO_TOKEN}` only — **the token is never committed**.

1. Generate a **dedicated** token at [Expo → Access tokens](https://expo.dev/settings/access-tokens) (Personal access tokens → Create token).
2. Make it available as a real environment variable named `EXPO_TOKEN`:
   - **Claude Code on the web (cloud):** add `EXPO_TOKEN` to your [environment's variables](https://code.claude.com/docs/en/claude-code-on-the-web#configure-your-environment).
   - **Desktop / terminal:** export it from your shell profile (`export EXPO_TOKEN=…`). Note: `.env` / `.env.local` files are **not** auto-loaded into the MCP header expansion, so a value placed only in a `.env` file will not be picked up — it must be an exported env var.
3. In Claude Code, approve the project MCP server on first use; run `/mcp` to check the connection.

> **Security.** Claude Code cloud environments have no dedicated secrets store — environment variables are visible to anyone who can edit the environment, and an Expo token grants account access. Use a dedicated token (not a shared/CI one), keep it in a **personal** environment, rotate it periodically, and revoke it from the Expo dashboard if it leaks.

### Local capabilities

Run the dev server with local MCP capabilities enabled:

```sh
npm run dev:mcp   # EXPO_UNSTABLE_MCP_SERVER=1 expo start
```

Reconnect the MCP server after starting or stopping the dev server so the local tools register. Requires Expo SDK 54+ (this project is on SDK 57).

## Development workflow

Development in this repository is agent-assisted via [Claude Code](https://claude.com/claude-code). The working agreement lives in [`CLAUDE.md`](./CLAUDE.md), which states how work runs here and makes [Loop Engineering](./.claude/skills/loop-engineering/SKILL.md) the mandatory change loop: every change goes through **plan → approve → code → verify → independent review → address → ready**, stepped through under [Delivering a unit of work end-to-end](#delivering-a-unit-of-work-end-to-end). There is no size threshold and no self-approval shortcut — that independent review is the only authoritative review of an agent's own change. This repository's own conventions — layout, styling and components, the data and server-state layers, logging, and the deviations from an installed skill it has accepted — live under [`docs/`](./docs/index.md), beside the product specs, the decision log, and the operations body that holds how a session operates GitHub. No skill trigger surfaces them and skill discovery never will, so [`CLAUDE.md`](./CLAUDE.md) routes to each document by name; an agent reads the one governing the surface it is changing, alongside whichever installed skill matches that surface.

### Agent skills

Every skill under [`.claude/skills/`](./.claude/skills) is an **installed copy** — the 26 general capabilities from [`axross/skills`](https://github.com/axross/skills), every one of them pinned by [`skills-lock.json`](./skills-lock.json). Nothing there is hand-written, and a hand-edit to any of them is discarded by the next reinstall, so never edit one to fix it. A rule that is wrong, outdated, or missing gets resolved one of two ways instead: open an issue against `axross/skills` when the gap generalizes beyond this project, or leave the skill untouched and write the gap and its workaround into [`docs/conventions/agent-skills.md`](./docs/conventions/agent-skills.md). Often both — the upstream issue is slow, and the local note keeps work moving until it lands.

This repository authors no skill of its own, so there is no second tier to tell apart. A rule specific to this repository is a document under [`docs/conventions/`](./docs/conventions/) or [`docs/operations/`](./docs/operations/) instead, which [`CLAUDE.md`](./CLAUDE.md) routes to by name — the route the installed `agent-skill-management` capability asks for wherever an always-loaded instruction file can carry it. The one repository-local skill this project had, `project-structure`, was retired into `docs/` on those grounds.

Refresh the installed copies with the [vercel-labs/skills](https://github.com/vercel-labs/skills) CLI, then commit the regenerated directories together with `skills-lock.json`:

```sh
npx skills add axross/skills --agent claude-code --yes --copy \
  --skill agent-skill-authoring --skill agent-skill-management \
  --skill application-security --skill code-maintainability \
  --skill code-review --skill conventional-commits \
  --skill end-to-end-testing --skill expo-app-development \
  --skill github-operation --skill high-fidelity-ui-design \
  --skill jest-testing --skill living-project-documentation \
  --skill loop-engineering --skill product-requirement-document-authoring \
  --skill professional-behavior --skill quality-assurance \
  --skill react-component-development --skill react-component-styling \
  --skill sentry-instrumentation --skill software-development \
  --skill software-instrumentation --skill tanstack-query-development \
  --skill technical-document-authoring --skill unit-testing \
  --skill wireframe-design --skill zod-schema
```

Each skill is named deliberately rather than passing `--skill '*'`: the library also ships vendor, framework, and test-runner layers this app has no call site for — `next-app-development` (no Next.js), `amplitude-instrumentation` (no Amplitude), and `vitest-testing` (this project's runner is Jest, and upstream treats Jest and Vitest as alternatives rather than companions) — and a wildcard refresh would keep reinstalling them. Add a skill to the list when the library gains one worth taking.

Two of those names are coupled, so **do not drop `github-operation` while tidying that list**: `loop-engineering` no longer carries GitHub mechanics of its own — it defers them and states that a harness driving the loop needs `github-operation` installed alongside it. Removing it would not remove one capability; it would leave this repository's mandatory change loop without the rules its every GitHub step depends on. This repository's own half of those rules is [`docs/operations/github.md`](./docs/operations/github.md).

The library moves quickly, so re-run this periodically rather than only when adding a skill: skills are pinned to upstream's default-branch HEAD by the hashes in `skills-lock.json`, with no version tag to hold them still. A refresh that produces no diff is the evidence they are current.

If npx cannot resolve the CLI (`npm error could not determine executable to run`), pin the version: `npx --yes skills@latest add …`.

### Delivering a unit of work end-to-end

[Loop Engineering](./.claude/skills/loop-engineering/SKILL.md) is the repository's **mandatory** change loop — every code change and document update goes through it, a one-line copy fix as much as a new feature. It runs **model-invoked** — there is no slash command; describe the work (a GitHub issue, a pull request, or a free-form request) and the loop drives it from intake to a merge-ready pull request in a single continuing session:

1. **Plan** — reads the issue and its thread, asks you the product and scope questions the spec leaves open, and rewrites the issue body into a reviewable plan with acceptance criteria. It then **always pauses for your approval**: nothing gets built until you review the plan and tell it to continue.
2. **Code + verify** — implements the approved plan on an agent-namespaced `claude/` branch, runs the checks the changed surface requires, and self-reviews the diff. The implementation itself may be delegated to a single bounded worker rather than run in the session you are talking to; where the harness's delegation policy is undetermined, the run asks you that one question before it edits its first project file. Nothing about the loop changes either way — same approved plan, same checks, same independent review.
3. **Independent review** — opens a draft pull request and requests the CI reviewer, a separate bot session, so the code's author never certifies its own work.
4. **Address** — fixes review findings and CI failures, tying each resolved thread to the resolving commit, for up to eight rounds.
5. **Ready** — flips the pull request to ready once CI is green and the review is clean. No session issues the merge itself; [`docs/operations/github.md`](./docs/operations/github.md) states why.

Kick it off by naming the work — "deliver issue #42", "pick up PR 57", or a free-form request (with no issue yet, it files a tracking issue first, then delivers it). To approve a paused plan or resume after a question, continue the session and tell it to continue.

### `@claude review` — get findings on any PR

Comment **`@claude review`** on a pull request to run this repository's review policy ([`REVIEW.md`](./REVIEW.md)) — severity-tagged findings with `file:line` evidence and concrete fixes, posted as inline comments by the CI reviewer ([`claude-review.yml`](./.github/workflows/claude-review.yml)). Use it for a pre-merge check on a hand-written change or a second opinion before merging. It is the same reviewer the change loop relies on: step 3 above requests it by posting that comment itself, so no review starts without one.

Changes made without an agent follow the same bar: branch, implement, run the checks below, open a pull request, and get it reviewed before merge.

## Testing

Unit tests (Jest via jest-expo, colocated with their subject) cover helpers, schemas, and component behavior; Maestro flows in `e2e/` assert whole user journeys on a simulator, tracked against the journey catalog in `e2e/scenarios.md`. Merges are gated by CI ([`merge-checks.yml`](./.github/workflows/merge-checks.yml)), which runs on every PR update as five independent, parallel jobs — **Lint** (Biome), **Typecheck** (TypeScript), **Unit Tests** (Jest), **E2E Scenario Coverage**, and **Docs** (the `docs/` validators below) — so a red check names exactly one failing tool.

> Branch protection: the `Lint` and `Unit Tests` check names are unchanged, but `Typecheck` and `E2E Scenario Coverage` are now **separate** checks (they used to be bundled into `Lint` and `Unit Tests` respectively). To keep gating merges on them, add both to the required status checks under Settings → Branches → branch protection for `main` — and `Docs` alongside them, which is new and gates nothing until it is added there.

## Commands

This table is the authoritative list of the repository's commands, for human contributors and agents alike. Run format + lint after every change, and the suites relevant to the changed surface before opening a pull request — see the Verification section of [`CLAUDE.md`](./CLAUDE.md).

| Command                     | What it does                                                                                                                              | When to run it                                                                                          |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `npm install`               | Installs dependencies pinned in `package.json`.                                                                                           | Once per checkout, and after `package.json` changes.                                                    |
| `npm run dev`               | Starts the Expo dev server; connect a dev build or simulator.                                                                             | Manual verification of UI, routing, and data-driven output.                                             |
| `npm run dev:mcp`           | Starts the dev server with the local Expo MCP capabilities enabled.                                                                       | When an agent needs simulator automation or project analysis.                                            |
| `npm run ios` / `android`   | Compiles and runs the native dev build on a simulator, emulator, or device.                                                               | When a change touches native modules or config plugins, which `expo export` does not exercise.          |
| `npm run build`             | Exports the production JS bundles for iOS and Android (`expo export`).                                                                    | After changes to routes, `app.json`, Babel/Metro config, dependencies, or public type signatures.       |
| `npm run format`            | Formats code and configuration with Biome.                                                                                                | After every set of edits, before committing.                                                             |
| `npm run lint`              | Runs Biome, including formatting and lint rules.                                                                                          | After formatting; fix every reported error before finishing.                                             |
| `npm run typecheck`         | Type-checks the project with the TypeScript compiler.                                                                                     | After any change to a TypeScript surface.                                                                |
| `npm run test:unit`         | Runs the Jest (jest-expo) unit suite.                                                                                                     | After a change affects code it covers.                                                                   |
| `npm run test:e2e`          | Checks scenario coverage, then runs the Maestro suite (needs a running simulator/emulator with the app installed).                        | After a change affects a user-facing output surface or e2e coverage.                                     |
| `npm run test:e2e:coverage` | Runs only the scenario-coverage gate — no device needed.                                                                                  | When no simulator is available; report the skipped on-device run.                                        |
| `npm run db-migrate:generate` | Generates a SQL migration under `src/core/db/migrations/` from changes to `src/core/db/schema.ts`.                                       | Immediately after changing the data-layer schema; commit the migration with the schema change.           |

Files under `src/core/db/migrations/` are generated — never hand-edit or amend a committed migration; change the schema and generate a new one. The generated migrations are meant to be applied on-device at startup via Drizzle's expo-sqlite migrator (`useMigrations`), which is **not wired yet**: the change that lands the first migration must also wire it into `src/app/_layout.tsx`.

The documentation under [`docs/`](./docs/index.md) has five checks of its own. They ship inside the installed `living-project-documentation` skill rather than as npm scripts, and the `Docs` job in [`merge-checks.yml`](./.github/workflows/merge-checks.yml) runs all five — plus the skills' link checker, pointed at `docs` — on every pull request. Run the same sequence locally after changing any document there:

```sh
failed=
for check in .claude/skills/living-project-documentation/scripts/check-*.mjs; do
  node "$check" docs || failed=1
done
node .claude/skills/agent-skill-authoring/scripts/check-links.mjs docs || failed=1
[ -z "$failed" ]
```

Each answers one question: `check-index.mjs` that every document is listed in `docs/index.md`, `check-references.mjs` that every relative link resolves, `check-glossary.mjs` that every spec has a glossary heading, `check-decision-naming.mjs` that every decision filename conforms, and `check-decision-supersede.mjs` that the supersede chain is sound and nothing cites replaced rationale. The loop runs all of them before failing, so one broken document does not hide the next.

If a required command cannot be run, say so — naming the command, the reason, and the residual risk — rather than presenting the change as fully verified.

## Preview builds

Per-PR Android preview builds are produced on demand by [`android-build.yml`](./.github/workflows/android-build.yml) — a **manually-dispatched** Fastlane workflow, not a merge gate and not tied to `pull_request` events. Dispatch it when a PR looks ready for merge to get a signed, installable APK distributed via **Firebase App Distribution**, so a human can verify the change on a physical device before merging.

- **How to run it:** from the Actions tab (**Run workflow** → pick the PR's branch), via `gh workflow run android-build.yml --ref <branch> -f pr=<number>`, or from an agent. The optional `pr` input makes the workflow comment the install link back on that PR; the link always appears in the run summary.
- **Four jobs:** `prebuild` runs `expo prebuild` and caches the generated `android/` project keyed by a checksum of `app.json` + `package-lock.json` (skipped on a cache hit), handing it to `build` via an artifact; `build` signs the release APK and uploads it as an artifact; `publish` downloads that APK and distributes it via Firebase App Distribution — always adding the `yo@axross.dev` tester (a workflow-level `FIREBASE_TESTERS` constant) so it installs without waiting on a manual invite; and `report` writes the install link to the run summary and, when the `pr` input is given, comments it on that PR. Splitting `build` from `publish` lets a failed distribution be re-run on its own (via **Re-run failed jobs**) without rebuilding the APK, and keeps each phase's credentials scoped to its own job. Requires the `ANDROID_*`, `FIREBASE_*`, and `SENTRY_AUTH_TOKEN` secrets above.
- **Not a merge blocker (by design):** merges are gated only by the checks in `merge-checks.yml`. On-device sign-off on a preview build is a manual, human-in-the-loop step before merging.

Store/production builds and on-demand dev clients are not wired into CI — the EAS pipelines that previously covered them have been removed. Local dev clients can still be compiled with `npm run ios` / `npm run android` (`expo run`); a non-EAS store/production release pipeline is future work.

## Repository gotchas

**Some dependencies move fast enough that memory is unreliable.** Consult the current official docs — as the primary source, not a blog post — before changing behavior these govern, and say which docs you consulted when the implementation depends on them.

| Dependency                                                                                                | Refresh docs before changing                                                                                                                                                                                                                                                                                                                                            |
| --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Expo (React Native)                                                                                       | Routing (Expo Router), app config and config plugins, native module APIs, asset/image behavior. Expo breaks between SDKs — use the versioned docs for the installed SDK (currently <https://docs.expo.dev/versions/v57.0.0/>).                                                                                                                                          |
| React Native native modules (reanimated, worklets, screens, gesture-handler, unistyles, nitro-modules, svg) | Each module's own compatibility table and peer-dependency ranges against the **exact** installed React Native version. The Expo SDK pin can lag or mismatch a module's real RN support — check when a native crash (hard crash, no JS error, no Sentry event) implicates one, or before bumping their versions.                                                            |
| Drizzle ORM over expo-sqlite                                                                              | Schema/table definitions, column types, query APIs, relation helpers, drizzle-kit migration generation, the expo-sqlite driver and runtime migrator.                                                                                                                                                                                                                    |
| Sentry                                                                                                    | SDK setup (`@sentry/react-native` and its Expo config plugin), instrumentation, source maps, event capture, PII behavior.                                                                                                                                                                                                                                              |
| TanStack Query                                                                                            | Option-helper and hook APIs, cache-lifetime defaults, and mutation callback signatures — behavior has moved inside v5.                                                                                                                                                                                                                                                 |
| Maestro                                                                                                   | Test runner configuration, snapshot behavior, locator/assertion APIs.                                                                                                                                                                                                                                                                                                  |
| Biome                                                                                                     | Formatter/linter configuration, suppression syntax, rule names.                                                                                                                                                                                                                                                                                                        |

**Some files fail globally rather than locally.** A small mismatch in one of these breaks the app at launch or the gate outright, not just one screen — refresh the owning tool's docs before editing: `app.json` and config plugins, `app.config.ts` (the dynamic layer that extends `app.json` at build time — it overrides `version` from `PREVIEW_VERSION_NAME` and injects `extra.commitHash`, so a value set only in `app.json` may not be the one that ships), `babel.config.js`, `metro.config.js`, `drizzle.config.ts` and `src/core/db/`, and the Sentry/Unistyles initialization in `src/core/helpers/` and `src/unistyles.ts`.

**Sentry's content collection stays off.** This project is on `@sentry/react-native` 7.x, where that is the `sendDefaultPii: false` set in `src/core/helpers/error-reporting.ts`. Newer SDK lines replace that boolean with a structured `dataCollection` option, so check which option the installed SDK actually accepts before changing it rather than applying the newer line's shape to this one.

**`src/core/helpers/error-reporting.ts` is the only module that imports `@sentry/react-native`** for capture, breadcrumbs, or initialization — everything else reaches Sentry through its wrappers, which is what keeps the capture surface auditable in one file. One exemption is deliberate: `settings-screen.tsx` imports `showFeedbackWidget` directly, which is a UI component rather than error capture. (The installed `sentry-instrumentation` capability asks a project to name its exempt files in its own documentation; this is that.)

**Every route is reachable through the `nakami://` deep-link scheme**, declared as `app.json`'s `scheme`. That makes route and search parameters an external input surface rather than an internal one: they arrive from outside the app, from a sender it cannot vouch for.

**All of `.claude/skills/` is generated, not source.** Every skill there is produced by `npx skills` from [`axross/skills`](https://github.com/axross/skills); a hand-edit to any of them is discarded by the next reinstall. Biome deliberately excludes `.claude/skills` and `.claude/assets` (see `biome.json`) so formatting never rewrites an upstream artifact and breaks its lockfile hash. That exclusion is belt-and-braces for Markdown either way — Biome does not process `.md` at all, so no document in this repository is formatted or linted by it. What does check the skills are the Node scripts that ship inside the installed `agent-skill-authoring` skill, and one of the four applies here:

```sh
node .claude/skills/agent-skill-authoring/scripts/check-links.mjs .claude/skills
```

`check-links.mjs` checks Markdown link integrity and is worth pointing at the whole `.claude/skills` tree rather than one skill — a refresh that drops or renames a reference file leaves a dead link inside an installed copy, and this is what catches it. Its three siblings — `check-skill-frontmatter.mjs`, `check-skill-body.mjs`, and `check-skill-references.mjs` — each take one skill directory and validate the skill being **authored** there: its frontmatter and naming, its body and routing-section format, and its reference linkage. This repository authors none, so there is nothing to point them at; running them over an installed copy only reports on upstream's own text, which is `axross/skills`' to fix rather than this repository's.

`agent-skill-management` also ships `check-installed-copies.mjs`, which fails when an installed copy has drifted from its source. It takes a source root and an installed root, and **does not apply here**: this repository authors no distributable skills of its own, so there is no `skills/` source tree for it to compare against. Drift from `axross/skills` is detected by re-running the refresh above and looking at the diff.

## Related links

<!-- Add project links here as they come to exist — docs, issue tracker, deployment dashboard, design files. -->
