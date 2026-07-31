# Runtime Conventions

Apply this reference when logging, reporting an error, handling external input or secrets, or rendering an image.

## Logging

Logging goes through the root logger in `src/core/helpers/logging.ts`, which runs at `debug` severity with two transports: a console transport (`debug` in development only; `info`/`warn`/`error` always) and a breadcrumb transport that mirrors every line to the error tracker. That second transport is why log content is a privacy surface — a line written for a developer's console also ships to Sentry.

**Guidelines:**

- MUST log through the root logger in `src/core/helpers/logging.ts`.
- MUST write log messages as a message string first and a single trailing context object, ending the message with a period, and MUST bracket a failable operation with "Started …" / "Completed …" lines.
- MUST NOT put credentials, tokens, raw request bodies, or PII in a log context — every line becomes a breadcrumb.

## Error Reporting

`src/core/helpers/error-reporting.ts` is the only module that talks to Sentry for capture, breadcrumbs, or initialization. Everything else reaches it through the wrappers, which is what keeps the SDK swappable and the capture surface auditable in one file.

**Guidelines:**

- MUST reach error reporting through the wrappers in `src/core/helpers/error-reporting.ts` — `initializeErrorReporter`, `reportError`, `wrapRootComponent`, `addBreadcrumb` — and MUST NOT import `@sentry/react-native` for capture, breadcrumbs, or initialization anywhere else. A Sentry **UI** component is a separate matter: `settings-screen.tsx` imports `showFeedbackWidget` directly, which is not error capture.

## Input Validation and Secrets

Every value that crosses into the app from outside is parsed before it is trusted, and the `EXPO_PUBLIC_` prefix is a publication boundary rather than a configuration convenience — those values are inlined into the client bundle and ship to every device.

**Guidelines:**

- MUST validate all external input with Zod: environment variables, deep-link route and search params, API payloads, and database-row parsing.
- MUST NOT place a secret behind an `EXPO_PUBLIC_` variable. The committed `.env` carries only the public Sentry DSN.
- MUST NOT perform a state-changing action directly from deep-link parameters without user confirmation.

## Sentry Content Collection

Sentry's content collection stays off. This project is on `@sentry/react-native` 7.x, where that is the `sendDefaultPii: false` currently set in `src/core/helpers/error-reporting.ts`. Newer SDK lines replace that boolean with a structured `dataCollection` option, and the installed Sentry instrumentation capability's rules are verified against the 8.x line — so the two do not describe the same option surface.

**Guidelines:**

- MUST keep Sentry's content collection off, and MUST check which option the installed SDK actually accepts before changing it rather than applying the newer line's shape to this one.

## Images and Bundled Assets

Remote images are rendered through `expo-image` with their cost declared up front — dimensions, cache policy, priority — and, inside a virtualized list, the recycling key that keeps a scrolled row from showing the previous row's image.

**Guidelines:**

- MUST render remote images through `expo-image` with explicit dimensions, a cache policy, and a priority hint, and MUST give an image inside a virtualized list a `recyclingKey`.
- SHOULD size a bundled asset for its largest rendered use, not the design-tool original.
