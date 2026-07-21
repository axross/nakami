import {
	loginResponseSchema,
	meResponseSchema,
	refreshResponseSchema,
} from "~/auth/models/session";
import {
	type PayloadServer,
	request,
	serverBaseUrl,
} from "~/common/helpers/payload-client";
import { createModuleLogger } from "~/core/helpers/logging";

const logger = createModuleLogger("auth/payload-client");

export type {
	PayloadErrorKind,
	PayloadServer,
} from "~/common/helpers/payload-client";
// Re-export the shared transport surface so existing auth consumers keep
// importing it from here; the canonical definitions live in ~/common.
export { PayloadRequestError } from "~/common/helpers/payload-client";

function endpoint(
	{ serverUrl, collectionSlug }: PayloadServer,
	path: string,
): string {
	return `${serverBaseUrl(serverUrl)}/api/${encodeURIComponent(collectionSlug)}${path}`;
}

/** Exchanges email + password for a session token. */
export async function login(
	server: PayloadServer,
	credentials: { email: string; password: string },
) {
	const body = await request(endpoint(server, "/login"), {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(credentials),
	});

	return loginResponseSchema.parse(body);
}

/** Re-validates a token; `user` is null when the token is no longer valid. */
export async function fetchMe(server: PayloadServer, token: string) {
	const body = await request(endpoint(server, "/me"), {
		method: "GET",
		headers: { Authorization: `JWT ${token}` },
	});

	return meResponseSchema.parse(body);
}

/** Exchanges a still-valid token for a fresh one with a later expiry. */
export async function refreshToken(server: PayloadServer, token: string) {
	const body = await request(endpoint(server, "/refresh-token"), {
		method: "POST",
		headers: {
			Authorization: `JWT ${token}`,
			"Content-Type": "application/json",
		},
	});

	return refreshResponseSchema.parse(body);
}

/** Best-effort remote logout; the caller clears local state regardless. */
export async function logout(
	server: PayloadServer,
	token: string,
): Promise<void> {
	await request(endpoint(server, "/logout"), {
		method: "POST",
		headers: { Authorization: `JWT ${token}` },
	});

	logger.info("Signed out remotely");
}
