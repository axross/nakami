import { create } from "zustand";
import { writeLastServerUrl } from "~/auth/helpers/last-server-url";
import { fetchMe, PayloadRequestError } from "~/auth/helpers/payload-client";
import {
	clearSession,
	readSession,
	writeSession,
} from "~/auth/helpers/session-storage";
import type { PayloadUser, Session } from "~/auth/models/session";
import { getSessionQueryKeyRoot } from "~/common/helpers/session-query-key";
import { reportError } from "~/core/helpers/error-reporting";
import { createModuleLogger } from "~/core/helpers/logging";
import { queryClient } from "~/core/helpers/query-client";

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
	/**
	 * Clears the stored session, marks the app unauthenticated, and evicts the
	 * ending session's cached server state. Every sign-out path runs through
	 * here, including the one {@link AuthStore.hydrate} takes when the server
	 * rejects a stored session.
	 */
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
	},

	async deauthenticate() {
		// Read the id before the session is gone — the eviction is keyed on it.
		const userId = get().session?.user.id ?? null;

		await clearSession();
		// Unauthenticate before evicting, not after: the collections queries gate
		// on an active session and the root navigator unmounts the tab group with
		// them, so closing that gate first is what stops a still-mounted observer
		// from refetching the entries the eviction below is about to remove.
		set({ status: "unauthenticated", session: null });

		if (userId !== null) {
			// Clearing the session does not clear the cache. Without this, the
			// ended session's collections and records stay readable in memory
			// until gcTime expires them. `removeQueries` rather than
			// `invalidateQueries`: invalidation leaves the data resident and can
			// refetch with a token that has already been discarded.
			queryClient.removeQueries({ queryKey: getSessionQueryKeyRoot(userId) });
		}
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
