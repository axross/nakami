# Secret and Environment-Variable Handling

Apply these rules to verify no secret is committed and `process.env` access stays inside the project's whitelisted boundary.

## Committed Secrets

Git history is permanent and replicated to every clone, so a secret that lands in one commit is leaked for good and needs rotation even after a follow-up commit deletes it.

**Guidelines:**

- MUST flag a Critical when the diff contains any literal value matching the shape of:
  - A service credential — a long random string assigned to an application-secret variable outside the single sanctioned config file that legitimately holds it
  - A service token with an embedded auth secret (e.g., a connection URL or DSN that includes credentials past the host)
  - A storage / blob access token (recognizable by its provider-specific prefix)
  - A database auth token (often JWT-shaped)
  - A test-user password literal anywhere outside `.env.example`
  - A third-party analytics or service token outside the whitelisted env-access files
- MUST flag a Critical when `.env.local`, `.env.production`, `.env`, or any `*.pem` / `*.key` file appears in the diff. They are gitignored — appearance means the gitignore was bypassed.
- MUST flag a Major when a value previously read from `process.env.*` is hard-coded into the diff "for testing".

## `process.env` Whitelist

The project restricts `process.env.*` access to a small set of whitelisted files (often enforced by a linter rule). The reviewer MUST flag a Critical for any new `process.env.*` access outside those files. The whitelist typically covers only:

| File category | Why it is whitelisted |
|---|---|
| The env-derived runtime barrel | The single sanctioned module that reads env vars and re-exports typed runtime values (origin, environment name, service DSNs/tokens, etc.) |
| Data-layer config | The data/content layer needs DB/storage credentials at build/startup time |
| App-framework config | Build/config-time access to CI and deployment env vars |
| Test config | Test config-time access to CI flags, base URL, and automation-bypass secrets |

**Guidelines:**

- MUST flag a Critical when a component, repository, helper, request handler, or data-layer resource reads `process.env` directly. It MUST go through the project's single env-derived runtime barrel.

## Public / Client-Exposed Env-Var Boundary

Expo inlines every `EXPO_PUBLIC_*` env var into the JS bundle at build time — anything carrying that prefix ships to every user and is extractable from the binary. Review focuses on critical-severity cases where a secret value is read via a client-exposed env var.

- The project legitimately uses a handful of client-exposed env vars for public-by-design values (environment name, build/commit identifier, error-tracker DSN, analytics token).

**Guidelines:**

- MUST flag a Critical when a secret value is read via a client-exposed (public-prefixed) env var. The public prefix is the public-bundle boundary — anything prefixed is shipped to every client.
- MUST flag a Major when a new client-exposed env var is introduced without a one-line justification of why it must be public.

## Logging and Telemetry

Every telemetry channel copies its payload into third-party retention the project cannot purge on demand, so a secret reaching any of them stays compromised for as long as those systems keep it.

**Guidelines:**

- MUST flag a Critical when a secret value (token, password, session ID, auth header) is interpolated into any `logger.info()` / `logger.warn()` call or any error-report extras. Device logs are readable by other tooling; the error tracker ships payloads off-device.
- MUST account for a "send default PII" option being enabled in the error-tracker config (this project sets `sendDefaultPii: false`) because device identifiers and request data would be attached automatically if it were flipped.
- MUST flag a Major when a change adds explicitly sensitive context (e.g., a bearer token) on top of that default.

## `.env.example`

An undocumented env var fails at runtime on the next fresh checkout or deployment, long after the change that introduced it merged.

**Guidelines:**

- MUST flag a Major when the diff introduces a new env var consumed at runtime but does not add a placeholder line to `.env.example`. The example file is the only documentation of which env vars exist.
