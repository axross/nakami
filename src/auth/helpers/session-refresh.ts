import {
	PayloadRequestError,
	refreshToken,
} from "~/auth/helpers/payload-client";
import { useAuthStore } from "~/auth/stores/auth-store";
import { createModuleLogger } from "~/core/helpers/logging";

const logger = createModuleLogger("auth/session-refresh");

// how close to expiry (in seconds) a token must be before it is refreshed.
// Payload's default token lifetime is 2h; refreshing within the final 30
// minutes keeps an active session alive with roughly one refresh per window,
// since a successful refresh pushes `exp` far past the window again.
export const REFRESH_LEAD_SECONDS = 30 * 60;

/**
 * whether a token with the given Unix `exp` (seconds) is due for refresh —
 * true once it is within {@link REFRESH_LEAD_SECONDS} of expiry, including
 * already-expired, so a foreground attempt either renews it or meets the auth
 * rejection that sends the session to `reauthenticate`.
 */
export function isWithinRefreshWindow(
	exp: number,
	nowMs: number = Date.now(),
): boolean {
	const nowSeconds = Math.floor(nowMs / 1000);
	return exp - nowSeconds <= REFRESH_LEAD_SECONDS;
}

// guards against overlapping refreshes from the interval + foreground triggers.
let refreshing = false;

/**
 * refreshes the token when the current session is authenticated and inside the
 * refresh window. an auth rejection hands the session to the store's
 * `reauthenticate`, which revives it from a stored sign-in or signs out; a
 * transport error keeps the session to retry on the next trigger. no-op
 * otherwise.
 */
export async function refreshSessionIfDue(): Promise<void> {
	const { session, applyRefresh } = useAuthStore.getState();

	if (session === null || refreshing || !isWithinRefreshWindow(session.exp)) {
		return;
	}

	refreshing = true;
	const startedAt = performance.now();
	// routine bracket-open at debug; each of the three closes below carries the
	// terminal `outcome`, mirroring `auth-store.hydrate`. log the endpoint only —
	// never the token.
	logger.debug("Started refreshing the session token.", {
		serverUrl: session.serverUrl,
	});

	try {
		const result = await refreshToken(
			{ serverUrl: session.serverUrl, collectionSlug: session.collectionSlug },
			session.token,
		);
		await applyRefresh(result.refreshedToken, result.exp, result.user);
		logger.info("Completed refreshing the session token.", {
			outcome: "refreshed",
			duration: performance.now() - startedAt,
		});
	} catch (error) {
		if (error instanceof PayloadRequestError && error.kind === "auth") {
			// where a session used to end for a user who was away long enough for
			// the token to expire. it now ends only for a user who declined to have
			// their credentials kept: `reauthenticate` replays them where there are
			// any, and the outcome it returns is what closes this bracket —
			// `signed-out` is the line this branch always wrote, and it still names
			// the reason. it stays at info either way: a rejected token is an
			// expected operational state, not a defect, so it is deliberately not
			// reported to the error tracker.
			const outcome = await useAuthStore.getState().reauthenticate();
			logger.info("Completed refreshing the session token.", {
				outcome,
				reason: "token-rejected",
				duration: performance.now() - startedAt,
			});
			return;
		}

		logger.warn("Completed refreshing the session token.", {
			outcome: "deferred",
			reason: error instanceof Error ? error.message : "unknown",
			duration: performance.now() - startedAt,
		});
	} finally {
		refreshing = false;
	}
}
