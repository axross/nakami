import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	jest,
} from "@jest/globals";
import { z } from "zod";
import { createModuleLogger } from "~/core/helpers/logging";
import { PayloadRequestError, parseResponse, request } from "./payload-client";

jest.mock("~/core/helpers/logging", () => {
	const moduleLogger = {
		debug: jest.fn(),
		info: jest.fn(),
		warn: jest.fn(),
		error: jest.fn(),
	};

	return { createModuleLogger: () => moduleLogger };
});

// The mocked factory hands back one shared logger, so this is the same object
// the module under test writes through.
const logger = jest.mocked(createModuleLogger("common/payload-client"));

const pageSchema = z.object({
	docs: z.array(z.object({ id: z.string(), email: z.email() })),
	totalDocs: z.number(),
});

// Shaped like the access response: a map whose keys come from the server, which
// is the one case where an issue path carries a value the response chose.
const accessLikeSchema = z.object({
	collections: z.record(z.string(), z.object({ read: z.boolean() })),
});

// A body that fails in two places at once, carrying a value that must never
// reach a log line, a breadcrumb, or an error report.
const SENSITIVE_VALUE = "sensitive-value-from-the-response-body";
const mismatchedBody = {
	docs: [{ id: "1", email: "not-an-email" }],
	totalDocs: SENSITIVE_VALUE,
};

function thrownFrom(run: () => unknown): unknown {
	try {
		run();
	} catch (error) {
		return error;
	}

	throw new Error("Expected the call to throw, but it returned.");
}

const originalFetch = globalThis.fetch;

/**
 * Stands in for the global fetch, following the idiom the auth client's own
 * test file established. The `afterEach` below puts the original back.
 */
function stubFetch(implementation: () => Promise<Response>): void {
	(globalThis as { fetch: typeof fetch }).fetch = jest.fn(
		implementation,
	) as unknown as typeof fetch;
}

/**
 * A 200 whose body cannot be decoded — a truncated payload, or a proxy's HTML
 * error page — modelled as the rejection `Response.json()` produces for it.
 */
function unparseableResponse(parseFailure: Error): Response {
	return {
		ok: true,
		status: 200,
		json: async () => {
			throw parseFailure;
		},
	} as unknown as Response;
}

/** Runs `request()` against the stubbed fetch, resolving with what it threw. */
async function attemptRequest(): Promise<unknown> {
	try {
		await request("fetchRecords", "https://cms.example.com/api/users", {});
	} catch (error) {
		return error;
	}

	throw new Error("Expected the request to reject, but it resolved.");
}

beforeEach(() => {
	jest.clearAllMocks();
});

afterEach(() => {
	(globalThis as { fetch: typeof fetch }).fetch = originalFetch;
});

describe("PayloadRequestError", () => {
	it("forwards an error-options object to the built-in cause", () => {
		const underlying = new Error("The socket closed.");

		const error = new PayloadRequestError("server", "Failed.", 500, {
			cause: underlying,
		});

		expect(error.cause).toBe(underlying);
		expect(error.kind).toBe("server");
		expect(error.status).toBe(500);
	});

	describe("when constructed without options", () => {
		it("leaves the cause undefined and the rest of the error unchanged", () => {
			const error = new PayloadRequestError("network", "Failed.");

			expect(error.cause).toBeUndefined();
			expect(error.name).toBe("PayloadRequestError");
			expect(error.message).toBe("Failed.");
			expect(error.kind).toBe("network");
			expect(error.status).toBeUndefined();
		});
	});
});

describe("request()", () => {
	describe("when fetch rejects", () => {
		it("throws a network-kind PayloadRequestError with no status", async () => {
			stubFetch(async () => {
				throw new TypeError("Network request failed");
			});

			const error = await attemptRequest();

			expect(error).toBeInstanceOf(PayloadRequestError);
			expect((error as PayloadRequestError).kind).toBe("network");
			expect((error as PayloadRequestError).status).toBeUndefined();
		});

		it("carries the rejection itself as the cause", async () => {
			const rejection = new TypeError("Network request failed");
			stubFetch(async () => {
				throw rejection;
			});

			const error = await attemptRequest();

			expect((error as PayloadRequestError).cause).toBe(rejection);
		});

		it("closes the breadcrumb bracket without disclosing the rejection", async () => {
			stubFetch(async () => {
				throw new TypeError("Network request failed for cms.example.com");
			});

			await attemptRequest();

			const failure = logger.debug.mock.calls.find(
				([message]) => message === "Failed request.",
			);
			// The closing half of the bracket the logging convention requires: a
			// start with no completion is what would read as a request still hanging.
			expect(failure).toBeDefined();
			// The rejection reaches the error tracker as a linked exception via the
			// cause. It stays off this line deliberately: every log line becomes a
			// breadcrumb that leaves the device, so the trail gains nothing here
			// that triage does not already get from the linked exception.
			expect(failure?.[1]).toEqual({
				operation: "fetchRecords",
				duration: expect.any(Number),
			});
		});
	});

	describe("when the response body does not parse", () => {
		it("throws a server-kind PayloadRequestError with no status", async () => {
			stubFetch(async () => unparseableResponse(new SyntaxError("Bad JSON")));

			const error = await attemptRequest();

			expect(error).toBeInstanceOf(PayloadRequestError);
			expect((error as PayloadRequestError).kind).toBe("server");
			expect((error as PayloadRequestError).status).toBeUndefined();
		});

		it("carries the parse failure itself as the cause", async () => {
			const parseFailure = new SyntaxError("Unexpected end of input");
			stubFetch(async () => unparseableResponse(parseFailure));

			const error = await attemptRequest();

			expect((error as PayloadRequestError).cause).toBe(parseFailure);
		});
	});
});

describe("parseResponse()", () => {
	it("returns the parsed body and strips what the schema does not model", () => {
		const parsed = parseResponse("fetchRecords", pageSchema, {
			docs: [{ id: "1", email: "you@example.com" }],
			totalDocs: 1,
			unmodelled: "dropped",
		});

		expect(parsed).toEqual({
			docs: [{ id: "1", email: "you@example.com" }],
			totalDocs: 1,
		});
	});

	it("throws a server-kind PayloadRequestError when the body does not match", () => {
		const error = thrownFrom(() =>
			parseResponse("fetchRecords", pageSchema, mismatchedBody),
		);

		expect(error).toBeInstanceOf(PayloadRequestError);
		expect((error as PayloadRequestError).kind).toBe("server");
	});

	it("carries the originating validation error as the cause", () => {
		const error = thrownFrom(() =>
			parseResponse("fetchRecords", pageSchema, mismatchedBody),
		);

		expect((error as PayloadRequestError).cause).toBeInstanceOf(z.ZodError);
	});

	it("logs the operation and the failing issue paths, and nothing else", () => {
		thrownFrom(() => parseResponse("fetchRecords", pageSchema, mismatchedBody));

		expect(logger.warn).toHaveBeenCalledTimes(1);
		const [message, context] = logger.warn.mock.calls[0] ?? [];
		expect(message).toBe("Rejected an unexpected response shape.");
		// `toEqual` on the whole object is what proves "and nothing else"; the
		// paths themselves are compared order-insensitively, since their order is
		// Zod's business rather than this helper's.
		expect(context).toEqual({
			operation: "fetchRecords",
			issuePaths: expect.arrayContaining(["docs.0.email", "totalDocs"]),
		});
		expect((context as { issuePaths: string[] }).issuePaths).toHaveLength(2);
	});

	it("puts a failing map key into the issue path, since the path is what names the failure", () => {
		thrownFrom(() =>
			parseResponse("fetchAccess", accessLikeSchema, {
				collections: { "acme-invoices": { read: "yes" } },
			}),
		);

		// Documented behavior rather than an oversight: a `z.record` key is part
		// of the path, so it is logged. Slugs are schema-level identifiers, not
		// user content — see the helper's own note on what a path can carry.
		const [, context] = logger.warn.mock.calls[0] ?? [];
		expect(context).toEqual({
			operation: "fetchAccess",
			issuePaths: ["collections.acme-invoices.read"],
		});
	});

	it("keeps every value from the response body out of the log and the cause", () => {
		const error = thrownFrom(() =>
			parseResponse("fetchRecords", pageSchema, mismatchedBody),
		);
		const [, context] = logger.warn.mock.calls[0] ?? [];
		const cause = (error as PayloadRequestError).cause as z.ZodError;

		expect(JSON.stringify(context)).not.toContain(SENSITIVE_VALUE);
		// Zod omits the offending input from its issues unless `reportInput` is
		// enabled, which this project never sets; the cause travels to the error
		// tracker, so pin it rather than trusting the default silently.
		expect(JSON.stringify(cause.issues)).not.toContain(SENSITIVE_VALUE);
		expect(cause.message).not.toContain(SENSITIVE_VALUE);
	});

	it("does not log when the body matches", () => {
		parseResponse("fetchRecords", pageSchema, {
			docs: [],
			totalDocs: 0,
		});

		expect(logger.warn).not.toHaveBeenCalled();
	});
});
