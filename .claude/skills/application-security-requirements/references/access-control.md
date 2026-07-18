# Access Control

Apply these rules to verify the change keeps sensitive data gated correctly. In this project the data layer is an on-device SQLite database (Drizzle ORM over expo-sqlite) owned by the single device user; authorization for remote data lives with the backend the app talks to, never in the app.

## On-Device Data Exposure

Everything the app persists lives on the user's device and rides along in OS backups, so the storage tier chosen for a value decides who can ever read it.

**Guidelines:**

- MUST flag a Critical when an access token, password, API key, or other credential is written to the Drizzle database or any plain key-value store — credentials belong in the platform keychain (`expo-secure-store`), which is encrypted at rest.
- MUST flag a Major when a new table or column stores sensitive personal data the feature does not strictly need — on-device data is still subject to device compromise and backup extraction.
- SHOULD flag a Minor when cached remote content with real privacy weight is stored without an expiry/cleanup path.

## Remote API Authorization

A client binary is fully inspectable, so any authorization decision or credential embedded in the app is public the moment it ships.

**Guidelines:**

- MUST flag a Critical when the app enforces an authorization rule client-side only (hiding a button, filtering a list) for data the backend would still return to an unauthorized call — the backend is the authority; the UI check is an affordance.
- MUST flag a Critical when a shared or privileged credential (service API key, admin token) is embedded in app code, config, or an `EXPO_PUBLIC_*` env var — anything in the bundle is extractable. Per-user credentials obtained at runtime are the only credentials the app may hold.
- MUST flag a Major when a new remote call transmits more local data than the endpoint needs.

## Deep-Link Surface

Every screen registered under the app's URL scheme is reachable from outside the app — other apps and web pages can open it with arbitrary parameters.

**Guidelines:**

- MUST flag a Major when a new deep-linkable route performs a state-changing action directly from its parameters without user confirmation.
- MUST flag a Major when deep-link parameters are trusted without validation (parse them with a Zod schema like any other external input, per the input-validation rules).

## Future Authentication System

> **Dormant until the app gains an authentication system** — remove this banner
> when accounts/sessions land, making the lens unconditional.

**Guidelines:**

- MUST flag a Critical when a diff introduces login/session handling that stores session material outside `expo-secure-store`, or weakens lockout/expiry settings the backend prescribes.
- MUST flag a Major when auth state is derived from anything other than the project's single authentication entry point once one exists.
