// matches an http(s) URL with a host. self-hosted Payload instances are often
// plain-HTTP on a LAN during setup, so http is allowed alongside https; any
// other scheme is rejected. deliberately regex-based rather than `new URL()`,
// whose React Native implementation is incomplete.
const HTTP_URL = /^https?:\/\/[^\s/$.?#][^\s]*$/i;

/**
 * validates and normalizes a user-entered Payload server URL. trims
 * surrounding whitespace and any trailing slashes, and returns the normalized
 * origin, or `null` when the value is not a well-formed http(s) URL.
 */
export function normalizeServerUrl(raw: string): string | null {
	const trimmed = raw.trim().replace(/\/+$/, "");

	if (!HTTP_URL.test(trimmed)) {
		return null;
	}

	return trimmed;
}
