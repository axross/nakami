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

// the mocked factory hands back one shared logger, so this is the same object
// the module under test writes through.
const logger = jest.mocked(createModuleLogger("common/payload-client"));

const pageSchema = z.object({
	docs: z.array(z.object({ id: z.string(), email: z.email() })),
	totalDocs: z.number(),
});

// shaped like the access response: a map whose keys come from the server, which
// is the one case where an issue path carries a value the response chose.
const accessLikeSchema = z.object({
	collections: z.record(z.string(), z.object({ read: z.boolean() })),
});

// a body that fails in two places at once, carrying a value that must never
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

/**
 * stands in for the global fetch. spying rather than assigning is what lets
 * `jest.restoreAllMocks()` in the hook below put the real one back.
 */
function stubFetch(implementation: () => Promise<Response>): void {
	jest.spyOn(globalThis, "fetch").mockImplementation(implementation);
}

/**
 * a 200 whose body cannot be decoded — a truncated payload, or a proxy's HTML
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

/** a refused response carrying whatever body the case is about. */
function refusalResponse(
	status: number,
	json: () => Promise<unknown>,
): Response {
	return { ok: false, status, json } as unknown as Response;
}

// the shape a real Payload 3.88.0 server returns for a rejected write, measured
// at status 400. `name` and the per-field `label` are present and unmodelled,
// so this is also the check that they are tolerated rather than fatal.
const REFUSAL_BODY = {
	errors: [
		{
			name: "ValidationError",
			message: "The following field is invalid: Title",
			data: {
				id: 1,
				collection: "posts",
				errors: [
					{ label: "Title", message: "This field is required.", path: "title" },
				],
			},
		},
	],
};

/** the `detail` a refused request produced, whatever else the error carries. */
async function detailFrom(response: Response) {
	stubFetch(async () => response);

	const error = (await attemptRequest()) as PayloadRequestError;

	return error.detail;
}

/** the call under test, as a promise the rejection matchers can take directly. */
function sendRequest(): Promise<unknown> {
	return request("fetchRecords", "https://cms.example.com/api/users", {});
}

/**
 * runs `sendRequest()` and resolves with whatever it threw, for the cases that
 * need the thrown object itself rather than a match against its shape.
 */
async function attemptRequest(): Promise<unknown> {
	try {
		await sendRequest();
	} catch (error) {
		return error;
	}

	throw new Error("Expected the request to reject, but it resolved.");
}

beforeEach(() => {
	jest.clearAllMocks();
});

afterEach(() => {
	jest.restoreAllMocks();
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
			expect(error.detail).toBeUndefined();
		});
	});
});

describe("request()", () => {
	describe("when fetch rejects", () => {
		it("throws a network-kind PayloadRequestError with no status", async () => {
			stubFetch(async () => {
				throw new TypeError("Network request failed");
			});

			const attempt = sendRequest();

			await expect(attempt).rejects.toThrow(PayloadRequestError);
			await expect(attempt).rejects.toMatchObject({
				kind: "network",
				status: undefined,
			});
		});

		it("carries the rejection itself as the cause", async () => {
			expect.assertions(1);
			const rejection = new TypeError("Network request failed");
			stubFetch(async () => {
				throw rejection;
			});

			const error = await attemptRequest();

			// identity, not equality: `.rejects.toHaveProperty("cause", …)` compares
			// an `Error` recursively by `name` and `message`, which would still pass
			// if the wrapper attached a different error that happened to read alike.
			expect((error as PayloadRequestError).cause).toBe(rejection);
		});

		it("closes the breadcrumb bracket without disclosing the rejection", async () => {
			expect.assertions(2);
			stubFetch(async () => {
				throw new TypeError("Network request failed for cms.example.com");
			});

			await attemptRequest();

			const failure = logger.debug.mock.calls.find(
				([message]) => message === "Failed request.",
			);
			// the closing half of the bracket the logging convention requires: a
			// start with no completion is what would read as a request still hanging.
			expect(failure).toBeDefined();
			// the operation and the duration, and nothing else: no underlying
			// message. `request()` explains why at the throw site.
			expect(failure?.[1]).toEqual({
				operation: "fetchRecords",
				duration: expect.any(Number),
			});
		});
	});

	describe("when the server refuses the request", () => {
		it("carries the summary and the per-field messages the body named", async () => {
			const detail = await detailFrom(
				refusalResponse(400, async () => REFUSAL_BODY),
			);

			expect(detail).toEqual({
				message: "The following field is invalid: Title",
				fieldErrors: [{ path: "title", message: "This field is required." }],
			});
		});

		// the whole point of the addition: the sign-in screen reads `message`, and
		// every other consumer branches on `kind`. neither may move because a body
		// turned out to be readable.
		it("leaves the message, the kind, and the status exactly as they were", async () => {
			stubFetch(async () => refusalResponse(400, async () => REFUSAL_BODY));

			const error = (await attemptRequest()) as PayloadRequestError;

			expect(error.message).toBe("Unexpected response (400).");
			expect(error.kind).toBe("server");
			expect(error.status).toBe(400);
		});

		it("reads a rejected token's body the same way, without changing its kind", async () => {
			stubFetch(async () =>
				refusalResponse(401, async () => ({
					errors: [{ message: "The email or password provided is incorrect." }],
				})),
			);

			const error = (await attemptRequest()) as PayloadRequestError;

			expect(error.kind).toBe("auth");
			expect(error.message).toBe("Authentication was rejected.");
			expect(error.detail?.message).toBe(
				"The email or password provided is incorrect.",
			);
		});

		it("carries the summary alone when the refusal named no field", async () => {
			const detail = await detailFrom(
				refusalResponse(400, async () => ({
					errors: [{ message: "Something went wrong." }],
				})),
			);

			expect(detail).toEqual({
				message: "Something went wrong.",
				fieldErrors: [],
			});
		});

		// each of these is a body this app will meet on some server it has never
		// seen, and none of them may replace the failure being reported with a
		// parse failure of its own.
		it.each([
			[
				"a body that will not decode",
				async () => Promise.reject(new SyntaxError("Bad JSON")),
			],
			["an empty body", async () => undefined],
			["a body of the wrong shape", async () => ({ message: "Nope." })],
			["an empty errors array", async () => ({ errors: [] })],
			["an entry with no message", async () => ({ errors: [{ name: "E" }] })],
			[
				"a per-field entry missing its path",
				async () => ({
					errors: [
						{
							message: "Invalid.",
							data: { errors: [{ message: "Required." }] },
						},
					],
				}),
			],
		])("leaves the detail undefined for %s", async (_, json) => {
			const detail = await detailFrom(
				refusalResponse(400, json as () => Promise<unknown>),
			);

			expect(detail).toBeUndefined();
		});

		it("leaves the detail undefined when the response cannot be read at all", async () => {
			// a stub with no `json` at all, which is what every other suite in this
			// repository hands a non-ok status — reading it must not start failing
			// them.
			const detail = await detailFrom({
				ok: false,
				status: 500,
			} as unknown as Response);

			expect(detail).toBeUndefined();
		});
	});

	describe("when the response body does not parse", () => {
		it("throws a server-kind PayloadRequestError with no status", async () => {
			stubFetch(async () => unparseableResponse(new SyntaxError("Bad JSON")));

			const attempt = sendRequest();

			await expect(attempt).rejects.toThrow(PayloadRequestError);
			await expect(attempt).rejects.toMatchObject({
				kind: "server",
				status: undefined,
			});
		});

		it("carries the parse failure itself as the cause", async () => {
			expect.assertions(1);
			const parseFailure = new SyntaxError("Unexpected end of input");
			stubFetch(async () => unparseableResponse(parseFailure));

			const error = await attemptRequest();

			// identity again, for the same reason as the network case above.
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

		// documented behavior rather than an oversight: a `z.record` key is part
		// of the path, so it is logged. slugs are schema-level identifiers, not
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
