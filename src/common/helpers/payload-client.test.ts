import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { z } from "zod";
import { createModuleLogger } from "~/core/helpers/logging";
import { PayloadRequestError, parseResponse } from "./payload-client";

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

beforeEach(() => {
	jest.clearAllMocks();
});

describe("parseResponse", () => {
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
		expect(context).toEqual({
			operation: "fetchRecords",
			issuePaths: ["docs.0.email", "totalDocs"],
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
