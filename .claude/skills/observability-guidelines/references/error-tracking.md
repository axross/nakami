# Error Tracking

Apply these rules when writing, reviewing, or modifying Sentry setup, error event capture, instrumentation files, or error context.

## Error Tracker Integration Boundaries

This project uses Sentry as its error-reporting service, initialized through the error tracker's init/config files. Sentry changes affect production diagnostics and privacy, so treat them as observability and security work.

**Guidelines:**

- MUST import error reporting through the project's wrapper — `reportError`/`wrapRootComponent` from `~/core/helpers/error-reporting` — in app code; `@sentry/react-native` itself is imported only inside that helper module.
- MUST consult the project's development guidelines (current-docs rules) before changing the error tracker's init/config files, source maps, or runtime options.
- MUST consult the project's application-security requirements (privacy-and-exposure rules) before adding event context, tags, user identifiers, breadcrumbs, or request data.
- SHOULD keep Sentry setup in the existing init/config files instead of scattering initialization across feature modules.

## Capturing Exceptions

Captured exceptions should represent unexpected failures or unexpected states that need investigation. Expected validation failures and normal not-found paths usually belong in control flow or logs, not the error-reporting service.

**Guidelines:**

- MUST report an error (via Sentry's capture call) whenever a caught error represents an unexpected failure that should be investigated.
- MUST report before an early return, redirect, not-found, or fallback path when the failure would otherwise disappear.
- MUST rethrow after reporting when the caller or error boundary still needs to handle the failure.
- SHOULD report non-thrown unexpected states with a descriptive `Error` object when they indicate a renderer, parser, or data-contract gap.
- MUST NOT report expected user input validation failures as exceptions unless they indicate abuse or a system defect.

## Breadcrumbs

Breadcrumbs are the trail of recent events the error tracker attaches to the next captured exception, so a reported issue arrives with the sequence that led up to it — often the difference between a one-line stack trace and an actionable report. The structured logger feeds this trail automatically: its transport mirrors every log line (all levels, including `debug`) into Sentry via `addBreadcrumb`. Logging well is therefore how you get a useful breadcrumb trail.

**Guidelines:**

- SHOULD populate the breadcrumb trail through ordinary log calls rather than manual `addBreadcrumb` calls — bracketing operations at `debug` (see [logging.md](./logging.md)) is what makes a captured exception legible.
- MUST import `addBreadcrumb` from the project's wrapper — `~/core/helpers/error-reporting` — never `@sentry/react-native` directly, and reserve direct calls for a non-log event worth placing on the timeline.
- MUST keep breadcrumb `message`, `category`, and `data` free of secrets, tokens, raw request bodies, and PII; the same [Event Context and PII](#event-context-and-pii) rules apply, because breadcrumb data ships to Sentry with the exception.
- SHOULD attach a public identifier (an entity `id`, `url`, module name) as breadcrumb `data` so the trail is filterable, mirroring the logging context rules.

## Event Context and PII

Sentry context should explain the failure without copying private content into a third-party event.

**Guidelines:**

- MUST NOT attach secrets, raw request bodies, raw user content, access tokens, non-public content, session data, or private data-layer fields to Sentry context.
- MUST treat any "send default PII" option as a privacy-sensitive setting and justify any new user, request, or identifier context.
- SHOULD prefer route names, public identifiers, operation names, feature flags, and booleans over raw content values.
- SHOULD include enough stable context to make issues actionable, such as an entity `id`, `url`, `filename`, or module name when those values are intentionally public.
