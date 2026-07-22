# E2E Test Conventions

## Locator Usage

Elements are targeted by stable test-id hooks (`testID` on the component, `id:` in the flow), so copy edits and layout reshuffles never break a flow. When a hook is missing, the fallback order goes through accessibility, then copy: accessibility labels cover controls that cannot carry a test id, and text matching is reserved for assertions about the copy itself.

**Guidelines:**

- MUST use `id:` selectors (matching the component's `testID`) as the default for locating elements.
- MUST use kebab-case for test IDs.
- MUST disambiguate repeated elements with Maestro's relative selectors (`below`, `above`, `containsChild`, `index` as a last resort) instead of relying on match order.
- MUST use accessibility-label matching for accessible controls (buttons, tabs) that cannot carry a test id — for example, native controls the project cannot instrument.
- MUST NOT use text-matching selectors except when the assertion is about the copy itself, such as an empty-state message.
- MUST add a new `testID` to the component when no stable hook exists rather than matching on text or position.

**Example:**

```yaml
appId: app.axross.nakami
name: home — summary section renders
tags:
  - scenario:app-launch
---
- launchApp
- assertVisible:
    id: "home-screen"
- assertVisible:
    id: "summary-title"
    below:
      id: "home-header"
```

## Assertions and Waiting

Maestro's visibility assertions (`assertVisible`, `assertNotVisible`) auto-wait up to their timeout; `assertTrue` evaluates its condition immediately, so wrap async conditions in `extendedWaitUntil` instead. Explicit waits exist for the cases auto-waiting cannot see.

**Guidelines:**

- MUST prefer Maestro's auto-waiting assertions over manual wait steps — they retry until the timeout and produce clearer failure output.
- MUST NOT use fixed sleeps (`swipe`/`waitFor` with arbitrary durations) to "let the animation finish" (see the project's quality-assurance guidelines, flakiness-tolerance rules).
- MUST use `extendedWaitUntil` with an explicit `timeout` for slow async settling (network-dependent content, database hydration) instead of a sleep.
- SHOULD use `waitForAnimationToEnd` when an animation must settle before the next interaction.

## Shared Setup

Journey-independent setup belongs in shared subflows so every flow starts from the same state and flow bodies show only the behavior under test.

**Guidelines:**

- SHOULD start flows from a clean state (`launchApp` with `clearState: true`) unless the journey under test is specifically about persisted state.
- SHOULD extract setup shared by two or more flows into a subflow under `e2e/helpers/` and invoke it with `runFlow`.
- SHOULD pass flow-specific values via Maestro `env` parameters instead of duplicating near-identical flows.
