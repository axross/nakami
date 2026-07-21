import { mutationOptions } from "@tanstack/react-query";
import { login } from "~/auth/helpers/payload-client";
import type { Session } from "~/auth/models/session";
import { useAuthStore } from "~/auth/stores/auth-store";

/** Input for a sign-in attempt; `serverUrl` is expected already normalized. */
export interface SignInInput {
	serverUrl: string;
	collectionSlug: string;
	email: string;
	password: string;
}

/**
 * Mutation options for signing in against a Payload server: exchanges
 * credentials for a token, then persists the session and marks the app
 * authenticated. Consume with `useMutation(getSignInMutationOptions())`; the
 * pending/error state drives the sign-in form and the password never leaves
 * this call. The raw error is surfaced unwrapped so the screen can map a
 * `PayloadRequestError` to a friendly message.
 */
export function getSignInMutationOptions() {
	return mutationOptions({
		mutationKey: ["auth", "sign-in"],
		mutationFn: async ({
			serverUrl,
			collectionSlug,
			email,
			password,
		}: SignInInput): Promise<Session> => {
			const server = { serverUrl, collectionSlug };
			const result = await login(server, { email, password });

			const session: Session = {
				...server,
				token: result.token,
				exp: result.exp,
				user: result.user,
			};
			// Read imperatively: a mutation factory holds no hooks, and the store
			// action is stable, so `getState()` is the correct non-reactive access.
			await useAuthStore.getState().authenticate(session);
			return session;
		},
	});
}
