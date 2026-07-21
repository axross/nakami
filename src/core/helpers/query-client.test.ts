import { describe, expect, it } from "@jest/globals";
import { PayloadRequestError } from "~/common/helpers/payload-client";
import { isReportableQueryError } from "./query-client";

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
