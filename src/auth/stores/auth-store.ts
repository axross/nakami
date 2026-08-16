import { create } from "zustand";
import { writeLastServerUrl } from "~/auth/helpers/last-server-url";
import { fetchMe, PayloadRequestError } from "~/auth/helpers/payload-client";
import {
	clearSession,
	readSession,
	writeSession,
} from "~/auth/helpers/session-storage";
import type { PayloadUser, Session } from "~/auth/models/session";
import { reportError } from "~/core/helpers/error-reporting";
import { createModuleLogger } from "~/core/helpers/logging";

const logger = createModuleLogger("auth/auth-store");

/**
 * App-wide auth state. `"loading"` is the pre-hydration state held behind the
 * splash screen; the app renders authenticated/unauthenticated surfaces only
 * after {@link AuthStore.hydrate} settles.
 */
export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthStore {
	status: AuthStatus;
	session: Session | null;
	/**
	 * Reads the stored session and verifies it against `/me`. Signs out on an
	 * explicit auth rejection; keeps the session on a transport error so the app
	 * stays usable offline. Always settles into a terminal status.
	 */
	hydrate: () => Promise<void>;
	/** Persists a freshly obtained session and marks the app authenticated. */
	authenticate: (session: Session) => Promise<void>;
	/** Clears the stored session and marks the app unauthenticated. */
	deauthenticate: () => Promise<void>;
	/** Replaces the token/expiry (and user) after a successful refresh. */
	applyRefresh: (
		token: string,
		exp: number,
		user?: PayloadUser,
	) => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
	status: "loading",
	session: null,

	async hydrate() {
		const startedAt = performance.now();

		try {
			logger.debug("Started session hydration.");

			const stored = await readSession();

			if (stored === null) {
				logger.debug("Completed session hydration.", {
					status: "unauthenticated",
					duration: performance.now() - startedAt,
				});
				set({ status: "unauthenticated", session: null });
				return;
			}

			// Trust the stored session while verifying, then reconcile.
			set({ status: "authenticated", session: stored });

			try {
				const me = await fetchMe(
					{
						serverUrl: stored.serverUrl,
						collectionSlug: stored.collectionSlug,
					},
					stored.token,
				);

				if (me.user === null) {
					logger.debug("Completed session hydration.", {
						status: "unauthenticated",
						duration: performance.now() - startedAt,
					});
					await get().deauthenticate();
					return;
				}

				const verified: Session = {
					...stored,
					user: me.user,
					token: me.token ?? stored.token,
					exp: me.exp ?? stored.exp,
				};
				await writeSession(verified);
				set({ status: "authenticated", session: verified });
				logger.debug("Completed session hydration.", {
					status: "authenticated",
					duration: performance.now() - startedAt,
				});
			} catch (error) {
				if (error instanceof PayloadRequestError && error.kind === "auth") {
					logger.debug("Completed session hydration.", {
						status: "unauthenticated",
						duration: performance.now() - startedAt,
					});
					await get().deauthenticate();
					return;
				}

				// Unreachable/unexpected: keep the stored session (offline-tolerant).
				logger.warn("Session verification deferred.", {
					reason: error instanceof Error ? error.message : "unknown",
				});
				// Offline-tolerant terminal path: the optimistic session stays,
				// so bracket it like the others for production breadcrumbs.
				logger.debug("Completed session hydration.", {
					status: "authenticated",
					duration: performance.now() - startedAt,
				});
			}
		} catch (error) {
			// Keychain read/write failure — fall back to a clean signed-out state.
			reportError(error, { extra: { scope: "auth/auth-store.hydrate" } });
			set({ status: "unauthenticated", session: null });
		}
	},

	async authenticate(session) {
		await writeSession(session);
		// Remember the endpoint so the next sign-in can pre-fill it; best-effort
		// inside the helper, so it never blocks authentication. Sign-out clears
		// the session but deliberately leaves this value in place.
		await writeLastServerUrl(session.serverUrl);
		set({ status: "authenticated", session });
		// One line per terminal store transition, at debug: each of these is an
		// internal step of an operation (sign-in, sign-out, refresh, hydration)
		// that already closes its own bracket at info. Logged after the keychain
		// write so the line only appears once the transition actually happened;
		// a throwing write is closed by the calling operation's failure line.
		// Never log the token or the user's email.
		logger.debug("Stored the session.", { serverUrl: session.serverUrl });
	},

	async deauthenticate() {
		await clearSession();
		set({ status: "unauthenticated", session: null });
		logger.debug("Cleared the session.");
	},

	async applyRefresh(token, exp, user) {
		const current = get().session;

		if (current === null) {
			return;
		}

		const next: Session = {
			...current,
			token,
			exp,
			user: user ?? current.user,
		};
		await writeSession(next);
		set({ session: next });
		logger.debug("Replaced the session token.", { exp });
	},
}));

/** Selector hook for app-wide auth status (Home, Settings, the tabs layout). */
export function useAuthStatus(): AuthStatus {
	return useAuthStore((state) => state.status);
}

/** Selector hook for the current session (Settings account section). */
export function useAuthSession(): Session | null {
	return useAuthStore((state) => state.session);
}
