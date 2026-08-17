import { mutationOptions } from "@tanstack/react-query";
import { login } from "~/auth/helpers/payload-client";
import type { Session } from "~/auth/models/session";
import { useAuthStore } from "~/auth/stores/auth-store";
import { createModuleLogger } from "~/core/helpers/logging";

const logger = createModuleLogger("auth/sign-in-mutation");

/** input for a sign-in attempt; `serverUrl` is expected already normalized. */
export interface SignInInput {
	serverUrl: string;
	collectionSlug: string;
	email: string;
	password: string;
}

/**
 * mutation options for signing in against a Payload server: exchanges
 * credentials for a token, then persists the session and marks the app
 * authenticated. consume with `useMutation(getSignInMutationOptions())`; the
 * pending/error state drives the sign-in form and the password never leaves
 * this call. the raw error is surfaced unwrapped so the screen can map a
 * `PayloadRequestError` to a friendly message.
 */
export function getSignInMutationOptions() {
	return mutationOptions({
		mutationKey: ["auth-session", "sign-in"],
		mutationFn: async ({
			serverUrl,
			collectionSlug,
			email,
			password,
		}: SignInInput): Promise<Session> => {
			const server = { serverUrl, collectionSlug };
			const startedAt = performance.now();
			// routine bracket-open at debug; the completion below is the
			// user-significant milestone at info. log the endpoint and collection
			// only — never the email or password.
			logger.debug("Started signing in.", { serverUrl, collectionSlug });

			try {
				const result = await login(server, { email, password });

				const session: Session = {
					...server,
					token: result.token,
					exp: result.exp,
					user: result.user,
				};
				// read imperatively: a mutation factory holds no hooks, and the
				// store action is stable, so `getState()` is the correct
				// non-reactive access.
				await useAuthStore.getState().authenticate(session);
				logger.info("Completed signing in.", {
					serverUrl,
					duration: performance.now() - startedAt,
				});
				return session;
			} catch (error) {
				// close the bracket on the failure path so the breadcrumb trail
				// reaches the sign-in failure. the message drives the form; no
				// credentials are logged.
				logger.warn("Failed signing in.", {
					serverUrl,
					duration: performance.now() - startedAt,
				});
				throw error;
			}
		},
	});
}
