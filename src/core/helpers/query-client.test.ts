import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	jest,
} from "@jest/globals";
import { PayloadRequestError } from "~/common/helpers/payload-client";
import { getSessionQueryKeyRoot } from "~/common/helpers/session-query-key";
import { reportError } from "~/core/helpers/error-reporting";
import { isReportableQueryError, queryClient } from "./query-client";

jest.mock("~/core/helpers/error-reporting");

const USER_ID = "68b0c1d2e3f4a5b6c7d8e9f0";

/**
 * Drives a real query through the app's own client until it settles as a
 * failure, so the cache's `onError` runs exactly as it does in the app. Retries
 * are switched off per call rather than on the client, which leaves the shared
 * instance's own retry baseline untouched.
 */
async function failQuery(queryKey: readonly unknown[], error: unknown) {
	await expect(
		queryClient.fetchQuery({
			queryKey,
			queryFn: () => Promise.reject(error),
			retry: false,
		}),
	).rejects.toBe(error);
}

beforeEach(() => {
	jest.clearAllMocks();
});

afterEach(() => {
	// The app's one client lives for the whole file, so empty it between tests.
	// Clearing also destroys the garbage-collection timer a settled query
	// schedules, which would otherwise hold the run open long past the last
	// assertion.
	queryClient.clear();
});

describe("isReportableQueryError", () => {
	it("does not report permission (auth) failures", () => {
		expect(
			isReportableQueryError(new PayloadRequestError("auth", "rejected", 403)),
		).toBe(false);
	});

	it("does not report connectivity (network) failures", () => {
		expect(
			isReportableQueryError(new PayloadRequestError("network", "unreachable")),
		).toBe(false);
	});

	it("reports unexpected server responses", () => {
		expect(
			isReportableQueryError(new PayloadRequestError("server", "boom", 500)),
		).toBe(true);
	});

	it("reports unparseable-payload and other unknown errors", () => {
		expect(isReportableQueryError(new Error("could not parse response"))).toBe(
			true,
		);
	});
});

describe("the query cache's failure reporting", () => {
	it("names the collection list that failed", async () => {
		const error = new PayloadRequestError("server", "boom", 500);

		await failQuery([...getSessionQueryKeyRoot(USER_ID), "collections"], error);

		expect(reportError).toHaveBeenCalledWith(error, {
			extra: { queryKey: "users/*/collections" },
		});
	});

	it("names the collection whose records failed", async () => {
		const error = new Error("could not parse response");

		await failQuery(
			[...getSessionQueryKeyRoot(USER_ID), "collections", "posts", "records"],
			error,
		);

		expect(reportError).toHaveBeenCalledWith(error, {
			extra: { queryKey: "users/*/collections/posts/records" },
		});
	});

	it("carries the signed-in user's id into no field of the report", async () => {
		await failQuery(
			[...getSessionQueryKeyRoot(USER_ID), "collections", "posts", "records"],
			new PayloadRequestError("server", "boom", 500),
		);

		expect(reportError).toHaveBeenCalledTimes(1);

		const [, context] = jest.mocked(reportError).mock.calls[0];
		expect(JSON.stringify(context)).not.toContain(USER_ID);
	});

	it("reports nothing when the failure is a permission (auth) one", async () => {
		await failQuery(
			[...getSessionQueryKeyRoot(USER_ID), "collections"],
			new PayloadRequestError("auth", "rejected", 403),
		);

		expect(reportError).not.toHaveBeenCalled();
	});

	it("reports nothing when the failure is a connectivity (network) one", async () => {
		await failQuery(
			[...getSessionQueryKeyRoot(USER_ID), "collections"],
			new PayloadRequestError("network", "unreachable"),
		);

		expect(reportError).not.toHaveBeenCalled();
	});
});
