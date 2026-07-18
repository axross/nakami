# Privacy and Exposure Control

Apply these rules when reviewing whether a change exposes data, identifiers, environment values, or error context beyond the intended audience. This app's exposure surfaces are the shipped binary itself (everything bundled is extractable), the `payloadmobile://` deep-link scheme, outbound requests, Sentry event context, and log output.

## Bundle and Environment Exposure

Everything compiled into the app binary — code, assets, and every `EXPO_PUBLIC_*` value — is readable by anyone with the app installed. The public env prefix is a release decision, not a typing convenience.

**Guidelines:**

- MUST flag any newly added `EXPO_PUBLIC_*` value unless it is safe for every user of the app to read (the committed Sentry DSN is the sanctioned example).
- MUST flag a Critical when secrets, auth tokens, admin identifiers, or privileged endpoints are embedded in app code, config, assets, or `EXPO_PUBLIC_*` values.
- MUST verify `process.env.*` access remains limited to the env-access files allowed by [secret-handling](./secret-handling.md) (`src/core/helpers/env.ts`).
- SHOULD ask for a narrower public value when a feature only needs a derived boolean or public identifier.

## Deep-Link and Outbound Exposure

Deep links are constructed and opened by other apps and web pages, and every outbound request shows the receiving server (and any on-path observer of the URL) what the app sends.

**Guidelines:**

- MUST flag a Major when a deep-link URL format is designed to carry sensitive data (tokens, personal data) in its parameters — links land in browser history, other apps' logs, and OS-level telemetry.
- MUST flag a Major when a new outbound request transmits more local data (database contents, device identifiers, usage detail) than the endpoint needs for the feature.
- MUST flag a Major when an error or empty state exposes internal identifiers, raw database records, or stack traces in user-visible UI.

## Error Reporting Exposure

An error-reporting service is a third-party data processor. Event context should be useful for debugging without carrying raw private content.

**Guidelines:**

- MUST flag a Major when Sentry context includes secrets, raw request/response bodies, raw user content, access tokens, or private data-layer fields.
- MUST treat a "send default PII" option in the Sentry config as a privacy-sensitive default and require explicit justification when adding identifiers to its context.
- SHOULD prefer stable non-sensitive identifiers such as route names, feature names, and boolean state over raw content values.

## Log Output Exposure

Device logs are readable by other tooling on the device and are routinely attached to bug reports, so a logged value is a shared value.

**Guidelines:**

- MUST flag a Major when a log line carries user content, credentials, or tokens rather than identifiers and metadata, per the project's observability guidelines (logging rules).
