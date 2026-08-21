import { mutationOptions } from "@tanstack/react-query";
import { login } from "~/auth/helpers/payload-client";
import type { Session } from "~/auth/models/session";
import type { StoredCredentials } from "~/auth/models/stored-credentials";
import { createModuleLogger } from "~/core/helpers/logging";

const logger = createModuleLogger("auth/sign-in-mutation");

/**
 * input for a sign-in attempt; `serverUrl` is expected already normalized.
 *
 * structurally a {@link StoredCredentials}, and deliberately so — what the
 * consent dialog offers to keep is exactly what was submitted here, so the
 * screen hands the mutation's own variables straight to `authenticate` rather
 * than reassembling them from four pieces of form state and risking a
 * mismatch. the alias below is what makes that intent checkable.
 */
export type SignInInput = StoredCredentials;

/**
 * mutation options for signing in against a Payload server: exchanges
 * credentials for a token and returns the resulting session. consume with
 * `useMutation(getSignInMutationOptions())`; the pending/error state drives the
 * sign-in form, and the password reaches only this call and the keychain write
 * the consent dialog's answer may make. the raw error is surfaced unwrapped so
 * the screen can map a `PayloadRequestError` to a friendly message.
 *
 * it deliberately does **not** authenticate. a successful login is followed by
 * the credential-consent dialog, and the app stays signed out behind it until
 * the user answers — which is what keeps that dialog un-skippable, since the
 * root navigator would otherwise unmount this whole stack the moment the store
 * flipped. the screen calls `authenticate` with the answer.
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
