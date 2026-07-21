import {
	PayloadRequestError,
	refreshToken,
} from "~/auth/helpers/payload-client";
import { useAuthStore } from "~/auth/stores/auth-store";
import { createModuleLogger } from "~/core/helpers/logging";

const logger = createModuleLogger("auth/session-refresh");

// How close to expiry (in seconds) a token must be before it is refreshed.
// Payload's default token lifetime is 2h; refreshing within the final 30
// minutes keeps an active session alive with roughly one refresh per window,
// since a successful refresh pushes `exp` far past the window again.
export const REFRESH_LEAD_SECONDS = 30 * 60;

/**
 * Whether a token with the given Unix `exp` (seconds) is due for refresh —
 * true once it is within {@link REFRESH_LEAD_SECONDS} of expiry, including
 * already-expired, so a foreground attempt either renews it or the resulting
 * auth rejection signs the user out.
 */
export function isWithinRefreshWindow(
	exp: number,
	nowMs: number = Date.now(),
): boolean {
	const nowSeconds = Math.floor(nowMs / 1000);
	return exp - nowSeconds <= REFRESH_LEAD_SECONDS;
}

// Guards against overlapping refreshes from the interval + foreground triggers.
let refreshing = false;

/**
 * Refreshes the token when the current session is authenticated and inside the
 * refresh window. Signs the user out on an auth rejection; keeps the session on
 * a transport error to retry on the next trigger. No-op otherwise.
 */
export async function refreshSessionIfDue(): Promise<void> {
	const { session, applyRefresh, deauthenticate } = useAuthStore.getState();

	if (session === null || refreshing || !isWithinRefreshWindow(session.exp)) {
		return;
	}

	refreshing = true;
	try {
		const result = await refreshToken(
			{ serverUrl: session.serverUrl, collectionSlug: session.collectionSlug },
			session.token,
		);
		await applyRefresh(result.refreshedToken, result.exp, result.user);
		logger.info("Refreshed session token");
	} catch (error) {
		if (error instanceof PayloadRequestError && error.kind === "auth") {
			await deauthenticate();
			return;
		}

		logger.warn("Token refresh deferred", {
			reason: error instanceof Error ? error.message : "unknown",
		});
	} finally {
		refreshing = false;
	}
}
