# Outbound Fetch and Remote Content

Apply these rules to verify outbound requests from the app cannot be steered at unintended targets by user- or content-controlled URLs, and that remote content renders through the sanctioned paths. The app has no server tier; the risk surface is the app itself fetching URLs that the user, synced content, or a connected backend supplies.

## The Outbound-Fetch Risk Surface

Any code that performs `fetch(url)` where `url` originates from user input or fetched content (e.g., a user-configured server address, a link found in synced content) is the principal surface. The app runs inside the user's own network, so a steered URL can probe LAN hosts or carry the app's credentials to the wrong host.

**Guidelines:**

- MUST flag a Critical when the diff removes URL parsing/validation (e.g., a Zod `z.url()` schema or `URL.canParse`) on an externally-supplied URL before it flows into a fetch, without replacing it with a stricter check.
- MUST flag a Critical when a request carrying the app's stored credentials (auth headers, tokens) is sent to a host derived from content rather than from the user's explicit server configuration — credentials are per-host, and content must not redirect them.
- MUST flag a Major when a new fetch of a content-controlled URL accepts non-HTTP(S) schemes — scheme-check before fetching (`http:`/`https:` only).
- MUST flag a Major when a new outbound fetch follows redirects and then trusts the final response as if it came from the original host — re-check `response.url` when the host carries trust decisions.
- SHOULD flag a Minor recommendation that any new outbound fetch passes a tight timeout (e.g., `signal: AbortSignal.timeout(<ms>)`) so a hung endpoint does not stall the screen it feeds.

## Remote Images and Embedded Content

A remote image URL in content is an outbound request the app makes automatically on render, so unvalidated image sources fetch on the content author's terms.

**Guidelines:**

- MUST flag a Major when a component renders a content-controlled image URL without scheme validation, or outside the project's `expo-image` pipeline (see the performance skill's image rules).
- MUST flag a Major when embedded web content (a WebView, if ever introduced) can navigate to arbitrary content-controlled URLs without an allowlist — a WebView is a browser holding the app's session state for whatever origin it lands on.

## Deep Links as an Inbound Steering Vector

A deep link is the inbound twin of the outbound problem: another app choosing this app's parameters.

**Guidelines:**

- MUST flag a Critical when a deep-link parameter flows into an outbound fetch or a credentialed request without the same validation as any other external input, per [access-control.md](./access-control.md) and the input-validation rules.
