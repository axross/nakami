# Auth and Session Management

Apply these rules to verify authentication handling is not weakened and the error tracker's PII exposure is bounded.

## Authentication and Session Material

> **Dormant until the app gains an authentication system** — remove this banner
> when accounts/sessions land, making the lens unconditional. The app has no
> login today; these rules govern any diff that introduces one.

Session material in a mobile app is a bearer credential on disk, so where it is stored and who can trigger its use decide the blast radius of a lost device.

**Guidelines:**

- MUST flag a Critical when session tokens, refresh tokens, or credentials are stored anywhere other than the platform keychain (`expo-secure-store`) — the Drizzle database, plain key-value storage, and files are all readable on a compromised or backed-up device.
- MUST flag a Critical when a new feature implements its own token handling or session lifecycle rather than relying on the project's single authentication entry point.
- MUST flag a Major when the diff weakens backend-prescribed auth settings the app controls (token expiry handling, logout-on-revocation, re-auth prompts for sensitive actions).
- MUST flag a Critical when a deep-link or URL parameter can establish or elevate an authenticated state — links leak by design into history, logs, and other apps.

## Error-Tracker PII Exposure

If Sentry is configured with a "send default PII" option, and/or session replay, it already captures device identifiers, network request data, and (with mobile replay) screen contents including form input.

**Guidelines:**

- MUST account for this review context when it applies: Sentry may already capture device info, request data, and (with session replay) rendered screen content.
- MUST flag a Critical when the diff adds a new authentication form, payment form, or any input that captures secrets, without applying Sentry's input-masking/blocking for replay.
- MUST flag a Major when a new error report attaches extra context (`reportError(error, { extra: { … } })`, mapping to Sentry's capture function) that contains a token, password, session ID, or full request/response body.
- SHOULD flag a Minor recommendation to scope the trace sample rate below `1` when a new high-traffic surface is introduced, to control Sentry quota.

## Localhost / Production Divergence

Code gated to the local environment escapes every production test and review scenario, so its divergence from the production path surfaces only after deployment.

**Guidelines:**

- MUST flag a Major when the diff causes a code path to execute only when running locally (`__DEV__` or an environment flag) but no equivalent exists for production — a dev-only auth or validation bypass that ships in a release build is a recurring class of bug.
