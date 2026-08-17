import * as SecureStore from "expo-secure-store";
import { reportError } from "~/core/helpers/error-reporting";

// the last-used server URL is a non-secret convenience value, kept in its own
// keychain entry separate from the session so the two persist independently:
// sign-out clears the session but deliberately leaves this behind, so the next
// sign-in can pre-fill the endpoint.
const LAST_SERVER_URL_KEY = "nakami.last-server-url";

/**
 * reads the server URL of the last successful sign-in, or `null` when none has
 * been stored yet or the keychain read fails (reported, then treated as absent
 * so the sign-in form falls back to an empty field).
 */
export async function readLastServerUrl(): Promise<string | null> {
	try {
		return await SecureStore.getItemAsync(LAST_SERVER_URL_KEY);
	} catch (error) {
		reportError(error, { extra: { scope: "auth/last-server-url.read" } });
		return null;
	}
}

/**
 * remembers the server URL of a successful sign-in, replacing any previous
 * value. best-effort: a keychain write failure is reported and swallowed so it
 * can never fail or block the authentication that triggered it.
 */
export async function writeLastServerUrl(serverUrl: string): Promise<void> {
	try {
		await SecureStore.setItemAsync(LAST_SERVER_URL_KEY, serverUrl);
	} catch (error) {
		reportError(error, { extra: { scope: "auth/last-server-url.write" } });
	}
}
