import { useMutation } from "@tanstack/react-query";
import { logout } from "~/auth/helpers/payload-client";
import { useAuthStore } from "~/auth/stores/auth-store";
import { createModuleLogger } from "~/core/helpers/logging";

const logger = createModuleLogger("auth/use-sign-out");

/**
 * Signs the user out: ends the remote session best-effort, then always clears
 * the local session. A failed remote logout (e.g. offline) does not block the
 * local sign-out.
 */
export function useSignOut() {
	const session = useAuthStore((state) => state.session);
	const deauthenticate = useAuthStore((state) => state.deauthenticate);

	return useMutation({
		mutationFn: async () => {
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
					logger.warn("Remote logout failed; signing out locally", {
						reason: error instanceof Error ? error.message : "unknown",
					});
				}
			}

			await deauthenticate();
		},
	});
}
