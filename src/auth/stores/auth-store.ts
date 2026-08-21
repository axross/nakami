import { create } from "zustand";
import {
	clearCredentials,
	readCredentials,
	writeCredentials,
} from "~/auth/helpers/credentials-storage";
import { writeLastServerUrl } from "~/auth/helpers/last-server-url";
import {
	fetchMe,
	login,
	PayloadRequestError,
} from "~/auth/helpers/payload-client";
import {
	clearSession,
	readSession,
	writeSession,
} from "~/auth/helpers/session-storage";
import type { PayloadUser, Session } from "~/auth/models/session";
import type { StoredCredentials } from "~/auth/models/stored-credentials";
import { getSessionQueryKeyRoot } from "~/common/helpers/session-query-key";
import { reportError } from "~/core/helpers/error-reporting";
import { createModuleLogger } from "~/core/helpers/logging";
import { queryClient } from "~/core/helpers/query-client";

const logger = createModuleLogger("auth/auth-store");

/**
 * app-wide auth state. `"loading"` is the pre-hydration state held behind the
 * splash screen; the app renders authenticated/unauthenticated surfaces only
 * after {@link AuthStore.hydrate} settles.
 */
export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

/**
 * how {@link AuthStore.reauthenticate} ended. the three are exactly the three
 * ends a rejected token can now have, and a caller closing its own log bracket
 * reports whichever it got:
 *
 * - `"reauthenticated"` — stored credentials bought a fresh session; the user
 *   never saw a sign-out.
 * - `"signed-out"` — there were no credentials to replay, or the server refused
 *   them. this is what every rejected token did before credentials existed.
 * - `"deferred"` — the server could not be reached, so nothing was decided. the
 *   session is left where it is and the next trigger tries again.
 */
export type ReauthenticationOutcome =
	| "reauthenticated"
	| "signed-out"
	| "deferred";

interface AuthStore {
	status: AuthStatus;
	session: Session | null;
	/**
	 * reads the stored session and verifies it against `/me`. an explicit auth
	 * rejection goes to {@link AuthStore.reauthenticate}, which either revives
	 * the session from a stored sign-in or signs out; a transport error keeps the
	 * session so the app stays usable offline. always settles into a terminal
	 * status.
	 */
	hydrate: () => Promise<void>;
	/**
	 * persists a freshly obtained session and marks the app authenticated,
	 * keeping `credentials` alongside it when the user allowed that at the
	 * consent dialog. passing none is the decline, and writes nothing new.
	 */
	authenticate: (
		session: Session,
		credentials?: StoredCredentials,
	) => Promise<void>;
	/**
	 * recovers a session whose token the server has rejected, by replaying the
	 * credentials the user allowed to be kept. signs out when there are none or
	 * the server refuses them, and leaves everything alone when the server cannot
	 * be reached. see {@link ReauthenticationOutcome}.
	 */
	reauthenticate: () => Promise<ReauthenticationOutcome>;
	/**
	 * clears the stored session and credentials, marks the app unauthenticated,
	 * and evicts the ending session's cached server state. every sign-out path
	 * runs through here, including the one {@link AuthStore.reauthenticate} takes
	 * when there is nothing left to sign in with.
	 */
	deauthenticate: () => Promise<void>;
	/** replaces the token/expiry (and user) after a successful refresh. */
	applyRefresh: (
		token: string,
		exp: number,
		user?: PayloadUser,
	) => Promise<void>;
}

/**
 * the re-authentication currently in flight, or `null`. it exists because
 * `reauthenticate` has two callers that meet the rejection of the *same* token
 * milliseconds apart on the launch this whole feature is for: `hydrate` flips
 * `status` to `"authenticated"` optimistically, before its own `/me` settles,
 * and that flip is what starts `useSessionRefresh`'s check — so `fetchMe` and
 * `refreshToken` are in flight together against one expired token, and both are
 * rejected together.
 *
 * without this, each caller would replay the stored password on its own: two
 * logins for one logical event, which spends two of Payload's
 * `maxLoginAttempts` when the password is stale — the very budget the
 * never-retried rule below exists to protect — and lets a rejected second
 * attempt sign out over a successful first one.
 *
 * the promise is shared rather than the work serialized, so the second caller
 * gets the outcome of the attempt that actually ran and closes its own log
 * bracket with what happened.
 */
let reauthenticating: Promise<ReauthenticationOutcome> | null = null;

export const useAuthStore = create<AuthStore>((set, get) => ({
	status: "loading",
	session: null,

	async hydrate() {
		const startedAt = performance.now();

		try {
			logger.debug("Started session hydration.");

			const stored = await readSession();

			if (stored === null) {
				// credentials never outlive the session they were stored beside.
				// `authenticate` writes the session first, so a crash between the two
				// writes can leave an entry with nothing to revive — and on iOS a
				// keychain entry survives the app's uninstall, so a reinstall meets
				// one too. clearing it here is what stops a stored password from
				// sitting on the device with nothing that would ever read it.
				await clearCredentials();
				logger.debug("Completed session hydration.", {
					status: "unauthenticated",
					duration: performance.now() - startedAt,
				});
				set({ status: "unauthenticated", session: null });
				return;
			}

			// trust the stored session while verifying, then reconcile.
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
					// the stored token is no longer valid — the ordinary end of a
					// launch after a gap longer than the server's token lifetime.
					// before that becomes a sign-out, the credentials the user allowed
					// this device to keep get a chance to buy a fresh session; with
					// none, `reauthenticate` signs out exactly as this branch used to.
					// logged after the attempt, since only then is the status known.
					const outcome = await get().reauthenticate();
					logger.debug("Completed session hydration.", {
						status:
							outcome === "signed-out" ? "unauthenticated" : "authenticated",
						outcome,
						duration: performance.now() - startedAt,
					});
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
					// the other shape the same rejection arrives in — a 401 rather than
					// a 200 carrying `user: null` — and it takes the same recovery.
					const outcome = await get().reauthenticate();
					logger.debug("Completed session hydration.", {
						status:
							outcome === "signed-out" ? "unauthenticated" : "authenticated",
						outcome,
						duration: performance.now() - startedAt,
					});
					return;
				}

				// unreachable/unexpected: keep the stored session (offline-tolerant).
				logger.warn("Session verification deferred.", {
					reason: error instanceof Error ? error.message : "unknown",
				});
				// offline-tolerant terminal path: the optimistic session stays,
				// so bracket it like the others for production breadcrumbs.
				logger.debug("Completed session hydration.", {
					status: "authenticated",
					duration: performance.now() - startedAt,
				});
			}
		} catch (error) {
			// keychain read/write failure — fall back to a clean signed-out state.
			reportError(error, { extra: { scope: "auth/auth-store.hydrate" } });
			set({ status: "unauthenticated", session: null });
		}
	},

	async authenticate(session, credentials) {
		await writeSession(session);
		// the session first, then the credentials, and the order is the point: a
		// failure between the two leaves a session with no credentials, which is
		// today's behaviour and recoverable, rather than a password with no
		// session, which nothing would ever read and `hydrate` has to clean up.
		if (credentials !== undefined) {
			try {
				await writeCredentials(credentials);
			} catch (error) {
				// the session is in the keychain but this call is about to reject,
				// so the sign-in screen will say the sign-in failed. take the session
				// back out first: left there, the next launch would read it, verify
				// it against `/me`, and sign the user in — contradicting the failure
				// they were just shown, with nothing on screen ever explaining it.
				try {
					await clearSession();
				} catch (rollbackError) {
					// the keychain is refusing both directions now. report it, and let
					// the original failure be the one the screen reports — a keychain
					// that cannot be written cannot be rolled back either, and the
					// mismatch above is the lesser of what is already wrong.
					reportError(rollbackError, {
						extra: { scope: "auth/auth-store.authenticate.rollback" },
					});
				}

				throw error;
			}
		}
		// remember the endpoint so the next sign-in can pre-fill it; best-effort
		// inside the helper, so it never blocks authentication. sign-out clears
		// the session but deliberately leaves this value in place.
		await writeLastServerUrl(session.serverUrl);
		set({ status: "authenticated", session });
		// one line per terminal store transition, at debug: each of these is an
		// internal step of an operation (sign-in, sign-out, refresh, hydration)
		// that already closes its own bracket at info. logged after the keychain
		// write so the line only appears once the transition actually happened;
		// a throwing write is closed by the calling operation's failure line.
		// never log the token or the user's email.
		logger.debug("Stored the session.", {
			serverUrl: session.serverUrl,
			// whether the user allowed their credentials to be kept, which is what
			// decides whether a later rejected token ends in a sign-out. the
			// credentials themselves are never logged — only that there are some.
			credentialsStored: credentials !== undefined,
		});
	},

	async reauthenticate() {
		// `??=` rather than a boolean flag: a second caller has to await the
		// attempt already running and receive its outcome, not skip it and report
		// an end that never happened. the entry is cleared once it settles, so a
		// later rejection can still start a fresh attempt.
		reauthenticating ??= attemptReauthentication().finally(() => {
			reauthenticating = null;
		});

		return reauthenticating;
	},

	async deauthenticate() {
		// read the id before the session is gone — the eviction is keyed on it.
		const userId = get().session?.user.id ?? null;

		await clearSession();
		// the credentials go with the session, on every sign-out path: the explicit
		// one from Settings, and the involuntary one a rejected token reaches
		// through `reauthenticate`. nothing else clears them, which is what makes
		// signing out the way to take back the consent the dialog asked for.
		await clearCredentials();
		// unauthenticate before evicting, not after: the collections queries gate
		// on an active session and the root navigator unmounts the tab group with
		// them, so closing that gate first is what stops a still-mounted observer
		// from refetching the entries the eviction below is about to remove.
		set({ status: "unauthenticated", session: null });

		if (userId !== null) {
			// clearing the session does not clear the cache. without this, the
			// ended session's collections and records stay readable in memory
			// until gcTime expires them. `removeQueries` rather than
			// `invalidateQueries`: invalidation leaves the data resident and can
			// refetch with a token that has already been discarded.
			queryClient.removeQueries({ queryKey: getSessionQueryKeyRoot(userId) });
		}

		// last, so the line stands for the whole terminal transition — the
		// keychain clear, the status flip, and the cache eviction above.
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

/**
 * one attempt at reviving a rejected session from the stored sign-in. it is a
 * module-level function rather than a store action so that {@link
 * reauthenticating} can hold exactly one of them; `reauthenticate` is the entry
 * point, and nothing else calls this.
 *
 * it settles rather than rejects, on every path. its two callers reach it from
 * inside their own `catch` blocks — `hydrate`'s, and `refreshSessionIfDue`'s,
 * which nothing awaits — so a throw here would surface as an unhandled
 * rejection rather than as a decision.
 */
async function attemptReauthentication(): Promise<ReauthenticationOutcome> {
	const startedAt = performance.now();

	try {
		const credentials = await readCredentials();

		if (credentials === null) {
			// nobody allowed anything to be kept, or the entry was unreadable and
			// `readCredentials` already discarded it. this is the path every
			// rejected token took before this feature existed.
			await useAuthStore.getState().deauthenticate();

			return "signed-out";
		}

		// bracketed like `refreshSessionIfDue`, and for the same reason: this runs
		// unattended, and the breadcrumb trail is the only record of it on a device
		// nobody can reach. the endpoint only — never the email or the password.
		logger.debug("Started re-authenticating from stored credentials.", {
			serverUrl: credentials.serverUrl,
		});

		try {
			const result = await login(
				{
					serverUrl: credentials.serverUrl,
					collectionSlug: credentials.collectionSlug,
				},
				{ email: credentials.email, password: credentials.password },
			);
			const session: Session = {
				serverUrl: credentials.serverUrl,
				collectionSlug: credentials.collectionSlug,
				token: result.token,
				exp: result.exp,
				user: result.user,
			};

			await writeSession(session);
			useAuthStore.setState({ status: "authenticated", session });
			logger.info("Completed re-authenticating from stored credentials.", {
				outcome: "reauthenticated",
				duration: performance.now() - startedAt,
			});

			return "reauthenticated";
		} catch (error) {
			if (error instanceof PayloadRequestError && error.kind === "auth") {
				// terminal, and deliberately not retried: the stored password no
				// longer opens the account — changed, or the user deactivated — and
				// replaying it on every trigger would walk the account into Payload's
				// `maxLoginAttempts` lockout. `deauthenticate` discards it.
				logger.info("Completed re-authenticating from stored credentials.", {
					outcome: "signed-out",
					reason: "credentials-rejected",
					duration: performance.now() - startedAt,
				});
				await useAuthStore.getState().deauthenticate();

				return "signed-out";
			}

			// the server said nothing about validity, so neither does this: the
			// session and the credentials both stay, and the next trigger retries.
			logger.warn("Completed re-authenticating from stored credentials.", {
				outcome: "deferred",
				reason: error instanceof Error ? error.message : "unknown",
				duration: performance.now() - startedAt,
			});

			return "deferred";
		}
	} catch (error) {
		// the keychain itself refused a read or a write — the one failure the two
		// inner paths do not already answer. nothing about the session was
		// decided, so this defers like an unreachable server; it is reported
		// because, unlike the paths above, it is a defect rather than an expected
		// operational state.
		reportError(error, {
			extra: { scope: "auth/auth-store.reauthenticate" },
		});

		return "deferred";
	}
}

/** selector hook for app-wide auth status (Home, Settings, the tabs layout). */
export function useAuthStatus(): AuthStatus {
	return useAuthStore((state) => state.status);
}

/** selector hook for the current session (Settings account section). */
export function useAuthSession(): Session | null {
	return useAuthStore((state) => state.session);
}
