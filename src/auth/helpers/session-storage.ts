import * as SecureStore from "expo-secure-store";
import { type Session, sessionSchema } from "~/auth/models/session";
import { reportError } from "~/core/helpers/error-reporting";

// The single keychain entry that holds the session. Session material is a
// bearer credential, so it lives only in the platform keychain — never the
// Drizzle database or plain key-value storage.
const SESSION_KEY = "payload-mobile.session";

/**
 * Reads the persisted session from the keychain, returning `null` when none is
 * stored or the stored value is unreadable/corrupt (in which case the bad
 * entry is cleared so the app falls back to a clean signed-out state).
 */
export async function readSession(): Promise<Session | null> {
	const raw = await SecureStore.getItemAsync(SESSION_KEY);

	if (raw === null) {
		return null;
	}

	try {
		return sessionSchema.parse(JSON.parse(raw));
	} catch (error) {
		reportError(error, { extra: { scope: "auth/session-storage.read" } });
		await clearSession();
		return null;
	}
}

/** Persists the session to the keychain, replacing any previous entry. */
export async function writeSession(session: Session): Promise<void> {
	await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
}

/** Removes the persisted session from the keychain. */
export async function clearSession(): Promise<void> {
	await SecureStore.deleteItemAsync(SESSION_KEY);
}
