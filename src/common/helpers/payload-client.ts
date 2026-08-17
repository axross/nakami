/**
 * low-level Payload REST transport shared across features. feature clients
 * (auth operations, collection access, …) build their typed calls on top of
 * {@link request} and {@link parseResponse}; the error taxonomy and server
 * identifier live here so the whole app maps Payload failures the same way.
 */

import type { z } from "zod";
import { createModuleLogger } from "~/core/helpers/logging";

const logger = createModuleLogger("common/payload-client");

const REQUEST_TIMEOUT_MS = 15_000;

/**
 * distinguishes an authentication rejection (the server said the credentials
 * or token are invalid) from a transport failure (the server could not be
 * reached) and any other unexpected response. callers sign the user out only on
 * `"auth"`, and keep the session on `"network"`.
 */
export type PayloadErrorKind = "auth" | "network" | "server";

export class PayloadRequestError extends Error {
	readonly kind: PayloadErrorKind;
	readonly status: number | undefined;

	/**
	 * `options.cause` carries the originating failure — the rejection `fetch`
	 * produced, the `SyntaxError` from a body that would not parse, or a
	 * `ZodError` from {@link parseResponse} — for diagnosis only: nothing
	 * branches on it, so no caller's signature learns about it.
	 */
	constructor(
		kind: PayloadErrorKind,
		message: string,
		status?: number,
		options?: ErrorOptions,
	) {
		super(message, options);
		this.name = "PayloadRequestError";
		this.kind = kind;
		this.status = status;
	}
}

/** identifies which Payload server and auth collection a request targets. */
export interface PayloadServer {
	readonly serverUrl: string;
	readonly collectionSlug: string;
}

/** normalizes a server URL to its origin without a trailing slash. */
export function serverBaseUrl(serverUrl: string): string {
	return serverUrl.replace(/\/+$/, "");
}

/**
 * performs a request against a Payload host with a timeout, mapping the outcome
 * to a {@link PayloadRequestError} on failure and returning the parsed JSON body
 * on success. credentials only ever travel to the caller-supplied host. the
 * `operation` label identifies the call in the request-lifecycle breadcrumbs.
 *
 * @throws {PayloadRequestError} on every failure path, in one of three kinds:
 * `"network"` when the transport never returned a response, whether the host
 * was unreachable or the timeout above aborted the call; `"auth"` on a 401 or
 * 403; and `"server"` both on any other non-ok status and on an ok response
 * whose body will not parse. the two paths with no HTTP status to report — the
 * dead transport and the unparseable body — carry the originating error as
 * `cause`.
 */
export async function request(
	operation: string,
	url: string,
	init: RequestInit,
): Promise<unknown> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
	const startedAt = performance.now();

	// routine per-request lifecycle → debug (dev-only). the operation label
	// identifies the call; the URL and body are omitted to keep credentials out.
	logger.debug("Started request.", { operation });

	let response: Response;
	try {
		response = await fetch(url, { ...init, signal: controller.signal });
	} catch (error) {
		// network down, DNS failure, timeout/abort — the server was unreachable.
		// close the bracket at debug (callers report the failure at their own
		// level) so the breadcrumb trail doesn't go quiet on the failure path.
		// the rejection rides on the thrown error's `cause` rather than this line:
		// `isReportableQueryError()` keeps `"network"` out of the tracker, so the
		// cause serves local diagnosis and whatever path does capture the error,
		// while a breadcrumb leaves the device either way — putting the underlying
		// message on one would add a telemetry surface for no triage gain.
		logger.debug("Failed request.", {
			operation,
			duration: performance.now() - startedAt,
		});
		throw new PayloadRequestError(
			"network",
			"The server could not be reached.",
			undefined,
			{ cause: error },
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
	} catch (error) {
		throw new PayloadRequestError(
			"server",
			"The server returned an invalid response.",
			undefined,
			{ cause: error },
		);
	}
}

/**
 * parses a body returned by {@link request} against the schema the caller
 * expects, bringing a shape mismatch inside the same error taxonomy every other
 * failure mode already uses. the app points at whatever Payload server the user typed
 * in, across unknown versions and configurations, so a 200 whose body does not
 * match is an ordinary runtime outcome rather than a defect — and a raw
 * `ZodError` escaping here would fall through every consumer's `kind` branch
 * instead of rendering the bad-response state. the validation error rides along
 * as the thrown error's `cause`, so the detail survives without `ZodError`
 * entering any caller's signature.
 *
 * only the operation label and the failing issue paths are logged, because
 * every log line here becomes an error-tracker breadcrumb and the body is
 * untrusted server content that may carry user data. a path is built from the
 * schema's own field names and array indices, so no field *value* is recorded
 * — with one exception worth naming rather than leaving to be discovered:
 * where the schema models a map (`z.record`), the failing key is itself part
 * of the path, and that key comes from the response. the only such schema in
 * this app keys by collection slug, which is a schema-level identifier rather
 * than user content, and identifiers are what a parse-failure line is supposed
 * to carry. a schema keying a map by something sensitive would need this
 * revisited.
 */
export function parseResponse<Schema extends z.ZodType>(
	operation: string,
	schema: Schema,
	body: unknown,
): z.infer<Schema> {
	const result = schema.safeParse(body);

	if (!result.success) {
		logger.warn("Rejected an unexpected response shape.", {
			operation,
			issuePaths: result.error.issues.map((issue) => issue.path.join(".")),
		});

		throw new PayloadRequestError(
			"server",
			"The server returned an unexpected response.",
			undefined,
			{ cause: result.error },
		);
	}

	return result.data;
}
