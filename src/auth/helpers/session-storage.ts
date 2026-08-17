import * as SecureStore from "expo-secure-store";
import { type Session, storedSessionCodec } from "~/auth/models/session";
import { reportError } from "~/core/helpers/error-reporting";

// the single keychain entry that holds the session. session material is a
// bearer credential, so it lives only in the platform keychain — never the
// Drizzle database or plain key-value storage.
const SESSION_KEY = "nakami.session";

/**
 * reads the persisted session from the keychain, returning `null` when none is
 * stored or the stored value is unreadable/corrupt (in which case the bad
 * entry is cleared so the app falls back to a clean signed-out state).
 */
export async function readSession(): Promise<Session | null> {
	const raw = await SecureStore.getItemAsync(SESSION_KEY);

	if (raw === null) {
		return null;
	}

	// an unreadable entry is an outcome, not a defect: the app is pointed at
	// whatever server the user typed in, and a build that tightens the schema
	// can meet an entry an older build wrote. hence the safe decode.
	const decoded = storedSessionCodec.safeDecode(raw);

	if (!decoded.success) {
		reportError(decoded.error, {
			extra: { scope: "auth/session-storage.read" },
		});
		await clearSession();
		return null;
	}

	return decoded.data;
}

/**
 * persists the session to the keychain, replacing any previous entry. encoding
 * through the same codec `readSession` decodes with is what keeps the stored
 * form and the domain form from drifting; it throws rather than storing a
 * session the read half would reject, which for a value the compiler already
 * typed as a {@link Session} is a defect.
 */
export async function writeSession(session: Session): Promise<void> {
	await SecureStore.setItemAsync(
		SESSION_KEY,
		storedSessionCodec.encode(session),
	);
}

/** removes the persisted session from the keychain. */
export async function clearSession(): Promise<void> {
	await SecureStore.deleteItemAsync(SESSION_KEY);
}
