# Preview Environments

Apply this reference when producing, surfacing, or documenting an installable preview of the app for on-device verification, or when a workflow needs to point a human at one. It is the skill-layer owner of the project's preview mechanism; other skills defer to it instead of restating CI specifics.

## The Android App Distribution Preview

The project's only preview channel today is a **manually-dispatched, signed Android APK** distributed through **Firebase App Distribution**, defined in [`android-build.yml`](../../../../.github/workflows/android-build.yml). It exists so a human can install the change on a physical device and verify it before merging.

| Property | Value |
| -------- | ----- |
| Trigger | `workflow_dispatch` only — never on `push`/`pull_request`. Dispatch it "when a PR looks ready for merge". |
| Ref | The pull request's branch; the build reflects that ref's head commit. |
| `pr` input | Optional PR number. When set, the workflow comments the install link on that pull request. |
| Output | A signed release APK uploaded to Firebase App Distribution; the tester install link is the run's `testing_uri`, surfaced in the run summary and (with `pr`) in the PR comment `📱 Android preview build ready — [install on a device](…)`. |
| Platform | Android only — the sole lane in `fastlane/Fastfile`. No iOS preview exists yet. |
| Merge gating | None. The build is deliberately **not** a merge blocker. |

Operator prerequisites (repo secrets/variables under Settings → Secrets and variables → Actions) must be configured or the build fails cleanly; the workflow header lists them (`ANDROID_KEYSTORE_*`, `FIREBASE_SERVICE_ACCOUNT_JSON`, `FIREBASE_ANDROID_APP_ID`, `SENTRY_AUTH_TOKEN`, etc.).

## Dispatching a Preview

Dispatch is a human (or agent) action, not an automatic one — there is no head-commit deploy to wait for.

**Guidelines:**

- MAY dispatch [`android-build.yml`](../../../../.github/workflows/android-build.yml) when a pull request looks ready for merge — from the Actions tab, `gh workflow run android-build.yml --ref <branch>`, or an agent dispatch — choosing the pull request's branch as the ref.
- SHOULD pass the `pr` input so the install link is commented on the pull request.
- MUST NOT treat a preview build as a merge gate: a missing, failed, or stale preview never blocks or reverts a merge decision.

## Surfacing an Existing Preview

A preview is only trustworthy when it reflects the commit under review. The PR comment carries **no commit SHA**, so freshness is judged by the workflow run, not the comment text.

**Guidelines:**

- MUST commit-match before pointing a human at an install link: use a build's install link only when its [`android-build.yml`](../../../../.github/workflows/android-build.yml) run succeeded and the run's head commit equals the current branch head.
- MUST fall back — dispatch a fresh build, or verify with a local `dev` build (`npm run android`, see [dev-commands.md](./dev-commands.md)) — when no run matches the head commit. MUST NOT surface a stale or fabricated install link.
- MUST state the mobile caveats with any install link: a signed APK, Android only, installed on a physical device via Firebase App Distribution.
