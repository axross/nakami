import { useMutation } from "@tanstack/react-query";
import { login } from "~/auth/helpers/payload-client";
import type { Session } from "~/auth/models/session";
import { useAuthStore } from "~/auth/stores/auth-store";
import { createModuleLogger } from "~/core/helpers/logging";

const logger = createModuleLogger("auth/use-sign-in");

/** Input for a sign-in attempt; `serverUrl` is expected already normalized. */
export interface SignInInput {
	serverUrl: string;
	collectionSlug: string;
	email: string;
	password: string;
}

/**
 * Signs in against a Payload server: exchanges credentials for a token, then
 * persists the session and marks the app authenticated. The pending/error
 * state drives the sign-in form; the password never leaves this call.
 */
export function useSignIn() {
	const authenticate = useAuthStore((state) => state.authenticate);

	return useMutation<Session, unknown, SignInInput>({
		mutationFn: async ({ serverUrl, collectionSlug, email, password }) => {
			const server = { serverUrl, collectionSlug };
			const startedAt = performance.now();
			// Routine bracket-open at debug; the completion below is the
			// user-significant milestone at info. Log the endpoint and collection
			// only — never the email or password.
			logger.debug("Started signing in.", { serverUrl, collectionSlug });

			const result = await login(server, { email, password });

			const session: Session = {
				...server,
				token: result.token,
				exp: result.exp,
				user: result.user,
			};
			await authenticate(session);
			logger.info("Completed signing in.", {
				serverUrl,
				duration: performance.now() - startedAt,
			});
			return session;
		},
	});
}
