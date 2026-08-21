import * as SecureStore from "expo-secure-store";
import {
	type StoredCredentials,
	storedCredentialsCodec,
} from "~/auth/models/stored-credentials";
import { reportError } from "~/core/helpers/error-reporting";

// the single keychain entry holding the credentials a silent re-authentication
// replays. its own key rather than a field on the session entry: the two have
// different lifetimes — a session is replaced on every refresh, the credentials
// only when the user signs in again — and different consent behind them.
const CREDENTIALS_KEY = "nakami.credentials";

// iOS only, and the one place this app departs from SecureStore's
// `WHEN_UNLOCKED` default. `_THIS_DEVICE_ONLY` is what keeps the entry out of an
// encrypted device backup and off any device it is restored onto, so a password
// the user allowed this device to keep stays on this device. the session entry
// keeps the default, which is a weaker promise about a value that expires by
// itself within hours.
//
// Android needs no counterpart: the entry there is encrypted with an Android
// Keystore key that never leaves the device, so a backed-up copy of the
// ciphertext cannot be decrypted anywhere else.
const CREDENTIALS_OPTIONS = {
	keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

/**
 * reads the stored credentials, returning `null` when the user never allowed
 * them to be kept, or when the stored value is unreadable (in which case the
 * bad entry is cleared, so the caller falls back to signing out rather than
 * retrying against a value it cannot use).
 */
export async function readCredentials(): Promise<StoredCredentials | null> {
	const raw = await SecureStore.getItemAsync(CREDENTIALS_KEY);

	if (raw === null) {
		return null;
	}

	// an unreadable entry is an outcome, not a defect — the same reasoning
	// `readSession` gives: a build that tightens this schema can meet an entry an
	// older build wrote.
	const decoded = storedCredentialsCodec.safeDecode(raw);

	if (!decoded.success) {
		reportError(decoded.error, {
			extra: { scope: "auth/credentials-storage.read" },
		});
		await clearCredentials();
		return null;
	}

	return decoded.data;
}

/**
 * persists the credentials, replacing any previous entry. encoding through the
 * same codec {@link readCredentials} decodes with keeps the stored form and the
 * domain form from drifting; it throws rather than storing a value the read
 * half would reject.
 */
export async function writeCredentials(
	credentials: StoredCredentials,
): Promise<void> {
	await SecureStore.setItemAsync(
		CREDENTIALS_KEY,
		storedCredentialsCodec.encode(credentials),
		CREDENTIALS_OPTIONS,
	);
}

/** removes the stored credentials from the keychain. */
export async function clearCredentials(): Promise<void> {
	await SecureStore.deleteItemAsync(CREDENTIALS_KEY);
}
