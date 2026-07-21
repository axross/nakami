import {
	loginResponseSchema,
	meResponseSchema,
	refreshResponseSchema,
} from "~/auth/models/session";
import { createModuleLogger } from "~/core/helpers/logging";

const logger = createModuleLogger("auth/payload-client");

const REQUEST_TIMEOUT_MS = 15_000;

/**
 * Distinguishes an authentication rejection (the server said the credentials
 * or token are invalid) from a transport failure (the server could not be
 * reached) and any other unexpected response. The launch/refresh flows sign
 * the user out only on `"auth"`, and keep the session on `"network"`.
 */
export type PayloadErrorKind = "auth" | "network" | "server";

export class PayloadRequestError extends Error {
	readonly kind: PayloadErrorKind;
	readonly status: number | undefined;

	constructor(kind: PayloadErrorKind, message: string, status?: number) {
		super(message);
		this.name = "PayloadRequestError";
		this.kind = kind;
		this.status = status;
	}
}

/** Identifies which Payload server and auth collection a request targets. */
export interface PayloadServer {
	readonly serverUrl: string;
	readonly collectionSlug: string;
}

function endpoint(
	{ serverUrl, collectionSlug }: PayloadServer,
	path: string,
): string {
	const base = serverUrl.replace(/\/+$/, "");
	return `${base}/api/${encodeURIComponent(collectionSlug)}${path}`;
}

/**
 * Performs a request against the configured Payload host with a timeout,
 * mapping the outcome to a {@link PayloadRequestError} on failure and returning
 * the parsed JSON body on success. Credentials only ever travel to the
 * caller-supplied host.
 */
async function request(
	operation: string,
	url: string,
	init: RequestInit,
): Promise<unknown> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

	// Routine per-request lifecycle → debug (dev-only). The operation label
	// identifies the call; the URL and body are omitted to keep credentials out.
	logger.debug("Started request.", { operation });

	let response: Response;
	try {
		response = await fetch(url, { ...init, signal: controller.signal });
	} catch {
		// Network down, DNS failure, timeout/abort — the server was unreachable.
		throw new PayloadRequestError(
			"network",
			"The server could not be reached.",
		);
	} finally {
		clearTimeout(timeout);
	}

	logger.debug("Completed request.", { operation, status: response.status });

	if (response.status === 401 || response.status === 403) {
		throw new PayloadRequestError(
			"auth",
			"Authentication was rejected.",
			response.status,
		);
	}

	if (!response.ok) {
		throw new PayloadRequestError(
			"server",
			`Unexpected response (${response.status}).`,
			response.status,
		);
	}

	try {
		return await response.json();
	} catch {
		throw new PayloadRequestError(
			"server",
			"The server returned an invalid response.",
		);
	}
}

/** Exchanges email + password for a session token. */
export async function login(
	server: PayloadServer,
	credentials: { email: string; password: string },
) {
	const body = await request("login", endpoint(server, "/login"), {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(credentials),
	});

	return loginResponseSchema.parse(body);
}

/** Re-validates a token; `user` is null when the token is no longer valid. */
export async function fetchMe(server: PayloadServer, token: string) {
	const body = await request("fetchMe", endpoint(server, "/me"), {
		method: "GET",
		headers: { Authorization: `JWT ${token}` },
	});

	return meResponseSchema.parse(body);
}

/** Exchanges a still-valid token for a fresh one with a later expiry. */
export async function refreshToken(server: PayloadServer, token: string) {
	const body = await request(
		"refreshToken",
		endpoint(server, "/refresh-token"),
		{
			method: "POST",
			headers: {
				Authorization: `JWT ${token}`,
				"Content-Type": "application/json",
			},
		},
	);

	return refreshResponseSchema.parse(body);
}

/** Best-effort remote logout; the caller clears local state regardless. */
export async function logout(
	server: PayloadServer,
	token: string,
): Promise<void> {
	await request("logout", endpoint(server, "/logout"), {
		method: "POST",
		headers: { Authorization: `JWT ${token}` },
	});

	logger.info("Signed out remotely.");
}
