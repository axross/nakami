import { mutationOptions } from "@tanstack/react-query";
import { logout } from "~/auth/helpers/payload-client";
import { useAuthStore } from "~/auth/stores/auth-store";
import { createModuleLogger } from "~/core/helpers/logging";

const logger = createModuleLogger("auth/sign-out-mutation");

/**
 * Mutation options for signing the user out: ends the remote session
 * best-effort, then always clears the local session. A failed remote logout
 * (e.g. offline) is caught and logged here so it never blocks the local
 * sign-out. Consume with `useMutation(getSignOutMutationOptions())`; the store
 * is read at call time via `getState()`, so the freshest session is used.
 */
export function getSignOutMutationOptions() {
	return mutationOptions({
		mutationKey: ["auth-session", "current", "sign-out"],
		mutationFn: async (): Promise<void> => {
			const { session, deauthenticate } = useAuthStore.getState();
			const startedAt = performance.now();
			// Routine bracket-open at debug; the completion below is the
			// user-significant milestone at info, matching `sign-in-mutation`.
			// `remoteSession` records whether there was a server session to end.
			logger.debug("Started signing out.", {
				remoteSession: session !== null,
			});

			try {
				if (session !== null) {
					try {
						await logout(
							{
								serverUrl: session.serverUrl,
								collectionSlug: session.collectionSlug,
							},
							session.token,
						);
					} catch (error) {
						// Tolerated: the local sign-out below proceeds regardless, so
						// this warns mid-operation rather than closing the bracket.
						logger.warn("Remote logout failed; signing out locally.", {
							reason: error instanceof Error ? error.message : "unknown",
						});
					}
				}

				await deauthenticate();
				logger.info("Completed signing out.", {
					duration: performance.now() - startedAt,
				});
			} catch (error) {
				// The local clear failed (keychain), so the user is not signed out.
				// Close the bracket before the error reaches the mutation's state.
				logger.warn("Failed signing out.", {
					duration: performance.now() - startedAt,
				});
				throw error;
			}
		},
	});
}
