---
name: application-security-requirements
description: The security and privacy review lens for code changes. Covers secrets/env vars, the framework's public/client-exposed env-var prefix, input validation, data-layer access control, public exposure, output-encoding/injection in rendered untrusted content, SSRF/outbound fetch of user-controlled URLs, auth/session settings, error-reporting data capture, and dependency supply-chain risk.
when_to_use: Use when reviewing security or privacy implications of a change — "is this safe", "security", "auth", "admin", "secret", "privacy", "PII", "XSS", "SSRF", or dependency reviews.
user-invocable: false
---

# Application Security Requirements

Apply these rules when reviewing the security implications of any code change in this project. The framing is OWASP Top 10 mapped onto this project's stack: an Expo (React Native) app with an on-device Drizzle/expo-sqlite data layer, Zod validation, and Sentry error reporting.

## Secret and Environment-Variable Handling

See [secret-handling.md](./references/secret-handling.md) for:

- No literal secret committed (any service credential, token, or test password)
- `process.env.*` accessed only inside the project's whitelisted env-access files
- The `EXPO_PUBLIC_*` prefix convention used only for values intentionally compiled into the shipped app bundle
- `.env.local` is gitignored; example only in `.env.example`

## Input Validation

See [input-validation.md](./references/input-validation.md) for:

- All request handlers validate and coerce request inputs before passing them to the data layer or an outbound `fetch`
- All route params / query params are treated as untrusted (their static types do not guarantee their runtime shape)
- Data-layer queries receive sanitized values (no type-coercion bypass on identifiers)
- Data-layer return values are parsed through the project's schema/validation library before reaching consumers

## Access Control

See [access-control.md](./references/access-control.md) for:

- Credentials never land in the Drizzle database or plain key-value storage — only the platform keychain
- Authorization for remote data stays with the backend; UI checks are affordances, not access control
- Deep-linkable routes validate their parameters and never state-change without confirmation

## Privacy and Exposure Control

See [privacy-and-exposure.md](./references/privacy-and-exposure.md) for:

- Everything bundled in the binary — code, assets, `EXPO_PUBLIC_*` values — is treated as public; no secrets or privileged endpoints ship in it
- Deep links and outbound requests carry no sensitive data beyond what the receiving side needs
- Error-reporting changes do not capture unnecessary PII, secrets, private content, or internal fields
- Log lines carry identifiers and metadata, never user content or credentials

## Injection in Rendered Untrusted Content

See [xss-in-markdown.md](./references/xss-in-markdown.md) for:

- Rich-text / markdown / HTML rendering of untrusted (user- or CMS-authored) content does not pass user-controlled values into raw-HTML sinks or unsanitized attributes
- Dangerous URL protocols (e.g., `javascript:`) are stripped or neutralized before reaching a rendered attribute
- Custom render nodes only emit attributes that the rendering layer encodes safely
- The framework's safe-encoding path is not bypassed (no manual string interpolation of untrusted content into markup)

## Outbound Fetch and Remote Content

See [ssrf-and-embeds.md](./references/ssrf-and-embeds.md) for:

- Externally-supplied URLs are validated (scheme, shape) before any `fetch`, and stored credentials only travel to the user's configured host
- Remote images render through the sanctioned `expo-image` path with validated sources
- Deep-link parameters never steer credentialed or outbound requests unvalidated
- Outbound fetches carry timeouts

## Auth and Session Management

See [auth-and-session.md](./references/auth-and-session.md) for:

- Session material lives in the platform keychain, behind the project's single auth entry point (dormant until auth lands)
- Error-tracker PII exposure is acknowledged when adding new identifiers/contexts
- Dev-only code paths (`__DEV__` gates) have a production equivalent

## Supply Chain

See [supply-chain.md](./references/supply-chain.md) for:

- New dependencies justify their addition per the project's development guidelines (change-management rules)
- New dependencies are reasonably popular, maintained, and platform-agnostic
- Lockfile is updated; transitive additions are inspected for known-vulnerable versions
- No `postinstall` / `prepare` script in a new dependency runs unexpected code
