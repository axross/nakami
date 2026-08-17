import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Query } from "@tanstack/react-query";
import { PayloadRequestError } from "~/common/helpers/payload-client";
import { getSessionQueryKeyRoot } from "~/common/helpers/session-query-key";
import { reportError } from "~/core/helpers/error-reporting";
import {
	isReportableQueryError,
	queryClient,
	reportQueryFailure,
} from "./query-client";

jest.mock("~/core/helpers/error-reporting");

const USER_ID = "68b0c1d2e3f4a5b6c7d8e9f0";

/**
 * The failing query as `reportQueryFailure` sees it. Only the key is read, and
 * a real `Query` can be built by nothing but a `QueryClient` — which these
 * tests deliberately do without, so no cache is shared between them and no
 * settled query schedules a garbage-collection timer that outlives the run.
 */
function failedQuery(queryKey: readonly unknown[]) {
	return { queryKey } as Query<unknown, unknown, unknown>;
}

beforeEach(() => {
	jest.clearAllMocks();
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

describe("reportQueryFailure()", () => {
	it("names the collection list that failed", () => {
		const error = new PayloadRequestError("server", "boom", 500);

		reportQueryFailure(
			error,
			failedQuery([...getSessionQueryKeyRoot(USER_ID), "collections"]),
		);

		expect(reportError).toHaveBeenCalledWith(error, {
			extra: { queryKey: "users/*/collections" },
		});
	});

	it("names the collection whose records failed", () => {
		const error = new Error("could not parse response");

		reportQueryFailure(
			error,
			failedQuery([
				...getSessionQueryKeyRoot(USER_ID),
				"collections",
				"posts",
				"records",
			]),
		);

		expect(reportError).toHaveBeenCalledWith(error, {
			extra: { queryKey: "users/*/collections/posts/records" },
		});
	});

	it("carries the signed-in user's id into no field of the report", () => {
		reportQueryFailure(
			new PayloadRequestError("server", "boom", 500),
			failedQuery([
				...getSessionQueryKeyRoot(USER_ID),
				"collections",
				"posts",
				"records",
			]),
		);

		expect(reportError).toHaveBeenCalledTimes(1);

		const [, context] = jest.mocked(reportError).mock.calls[0];
		expect(JSON.stringify(context)).not.toContain(USER_ID);
	});

	it("reports nothing when the failure is a permission (auth) one", () => {
		reportQueryFailure(
			new PayloadRequestError("auth", "rejected", 403),
			failedQuery([...getSessionQueryKeyRoot(USER_ID), "collections"]),
		);

		expect(reportError).not.toHaveBeenCalled();
	});

	it("reports nothing when the failure is a connectivity (network) one", () => {
		reportQueryFailure(
			new PayloadRequestError("network", "unreachable"),
			failedQuery([...getSessionQueryKeyRoot(USER_ID), "collections"]),
		);

		expect(reportError).not.toHaveBeenCalled();
	});
});

describe("queryClient", () => {
	it("reports its cache's query failures through reportQueryFailure", () => {
		expect(queryClient.getQueryCache().config.onError).toBe(reportQueryFailure);
	});
});
