import Constants from "expo-constants";

const SHORT_HASH_LENGTH = 7;

/**
 * the commit the app was built from, formatted for the settings screen.
 *
 * reads the full hash baked into the Expo config at build time (see the root
 * `app.config.ts`) via `expo-constants` and returns its short form. falls back
 * to "Unknown" when no hash is embedded — e.g. a render context with no build
 * config, such as unit tests.
 *
 * @returns the short (7-character) commit hash, or "Unknown" when unavailable.
 */
export function getCommitHash(): string {
	// `extra` is typed as `any`, so guard the shape before trusting it.
	const commitHash = Constants.expoConfig?.extra?.commitHash;
	if (typeof commitHash !== "string" || commitHash === "") {
		return "Unknown";
	}

	return commitHash.slice(0, SHORT_HASH_LENGTH);
}
