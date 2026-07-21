/**
 * Low-level Payload REST transport shared across features. Feature clients
 * (auth operations, collection access, …) build their typed calls on top of
 * {@link request}; the error taxonomy and server identifier live here so the
 * whole app maps Payload failures the same way.
 */

import { createModuleLogger } from "~/core/helpers/logging";

const logger = createModuleLogger("common/payload-client");

const REQUEST_TIMEOUT_MS = 15_000;

/**
 * Distinguishes an authentication rejection (the server said the credentials
 * or token are invalid) from a transport failure (the server could not be
 * reached) and any other unexpected response. Callers sign the user out only on
 * `"auth"`, and keep the session on `"network"`.
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

/** Normalizes a server URL to its origin without a trailing slash. */
export function serverBaseUrl(serverUrl: string): string {
	return serverUrl.replace(/\/+$/, "");
}

/**
 * Performs a request against a Payload host with a timeout, mapping the outcome
 * to a {@link PayloadRequestError} on failure and returning the parsed JSON body
 * on success. Credentials only ever travel to the caller-supplied host. The
 * `operation` label identifies the call in the request-lifecycle breadcrumbs.
 */
export async function request(
	operation: string,
	url: string,
	init: RequestInit,
): Promise<unknown> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
	const startedAt = performance.now();

	// Routine per-request lifecycle → debug (dev-only). The operation label
	// identifies the call; the URL and body are omitted to keep credentials out.
	logger.debug("Started request.", { operation });

	let response: Response;
	try {
		response = await fetch(url, { ...init, signal: controller.signal });
	} catch {
		// Network down, DNS failure, timeout/abort — the server was unreachable.
		// Close the bracket at debug (callers report the failure at their own
		// level) so the breadcrumb trail doesn't go quiet on the failure path.
		logger.debug("Failed request.", {
			operation,
			duration: performance.now() - startedAt,
		});
		throw new PayloadRequestError(
			"network",
			"The server could not be reached.",
		);
	} finally {
		clearTimeout(timeout);
	}

	logger.debug("Completed request.", {
		operation,
		status: response.status,
		duration: performance.now() - startedAt,
	});

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
