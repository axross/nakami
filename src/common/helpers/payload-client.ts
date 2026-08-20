/**
 * low-level Payload REST transport shared across features. feature clients
 * (auth operations, collection access, …) build their typed calls on top of
 * {@link request} and {@link parseResponse}; the error taxonomy and server
 * identifier live here so the whole app maps Payload failures the same way.
 */

import { z } from "zod";
import { createModuleLogger } from "~/core/helpers/logging";

const logger = createModuleLogger("common/payload-client");

const REQUEST_TIMEOUT_MS = 15_000;

/**
 * one field Payload named in a refusal. `path` is the field's own name, which
 * is what lets a caller match the message to the control that produced it;
 * `label` is Payload's admin-side label and is tolerated (stripped), since this
 * app derives its own.
 */
const fieldErrorSchema = z.object({
	path: z.string(),
	message: z.string(),
});

/**
 * one entry of a Payload error body. `message` is the summary — "The following
 * field is invalid: Title" — and the per-field entries hang off `data.errors`.
 * both nesting levels are optional: a refusal that names no field at all (a
 * custom hook, a lock conflict) carries the summary and nothing else.
 */
const errorEntrySchema = z.object({
	message: z.string(),
	data: z.object({ errors: z.array(fieldErrorSchema).optional() }).optional(),
});

/**
 * the body Payload returns with a refused write, measured against a real
 * 3.88.0 server at status 400:
 *
 * ```json
 * {"errors":[{"name":"ValidationError","message":"The following field is invalid: Title",
 *   "data":{"errors":[{"label":"Title","message":"This field is required.","path":"title"}]}}]}
 * ```
 */
const errorBodySchema = z.object({
	errors: z.array(errorEntrySchema).min(1),
});

/** what a refusal said, for a caller that can put it next to the input that caused it. */
export interface PayloadErrorDetail {
	/** the refusal's summary, e.g. "The following field is invalid: Title". */
	readonly message: string;
	/**
	 * the fields the refusal named, empty when it named none. a caller picks the
	 * entry whose `path` matches the field it just wrote and falls back to
	 * {@link PayloadErrorDetail.message}.
	 */
	readonly fieldErrors: readonly { path: string; message: string }[];
}

/**
 * reads what a non-ok response said, and never throws. the body is untrusted
 * server content of an unknown Payload version, so every way it can fail to be
 * what this expects — an unreadable stream, a non-JSON body, an empty one, a
 * shape that does not match — returns `undefined` rather than replacing the
 * failure the caller is already reporting with one of its own.
 */
async function readErrorDetail(
	response: Response,
): Promise<PayloadErrorDetail | undefined> {
	let body: unknown;

	try {
		body = await response.json();
	} catch {
		return undefined;
	}

	const result = errorBodySchema.safeParse(body);

	if (!result.success) {
		return undefined;
	}

	// the first entry is the refusal being reported; Payload lists further
	// entries only when several operations failed at once, which a single-field
	// write cannot produce.
	const [entry] = result.data.errors;

	return {
		message: entry.message,
		fieldErrors: entry.data?.errors ?? [],
	};
}

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
	 * what the server itself said, when the failure was a response whose body
	 * said anything this recognizes, and `undefined` otherwise. it is additive:
	 * {@link PayloadRequestError.message} is unchanged on every path, so a screen
	 * reading that alone reads exactly what it read before.
	 *
	 * it is for display beside the control that caused the refusal, and it is
	 * deliberately **not** reported: it is untrusted server prose that can quote
	 * the value a user typed, so it must not become telemetry. no report path
	 * carries it today — `reportQueryFailure` sends the described query key and
	 * nothing else, and the tracker serializes an `Error`'s name, message, and
	 * stack rather than its own fields, the way it already does not carry `kind`
	 * or `status` — and none of that may be widened while this field exists.
	 */
	readonly detail: PayloadErrorDetail | undefined;

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
		detail?: PayloadErrorDetail,
	) {
		super(message, options);
		this.name = "PayloadRequestError";
		this.kind = kind;
		this.status = status;
		this.detail = detail;
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
 *
 * a failure that *was* a response also carries whatever its body said as
 * {@link PayloadRequestError.detail}, so a caller can show the server's own
 * words. reading it cannot fail the request: an unreadable or unrecognized
 * body leaves `detail` undefined and changes nothing else about the error.
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

	if (!response.ok) {
		// read once, before the kinds part ways: both are refusals, and Payload
		// answers a rejected token in the same shape it answers a rejected value.
		// the kind, the message, and the status below are exactly what they were
		// before the body was read at all — `detail` is the only addition.
		const detail = await readErrorDetail(response);

		if (response.status === 401 || response.status === 403) {
			throw new PayloadRequestError(
				"auth",
				"Authentication was rejected.",
				response.status,
				undefined,
				detail,
			);
		}

		throw new PayloadRequestError(
			"server",
			`Unexpected response (${response.status}).`,
			response.status,
			undefined,
			detail,
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
