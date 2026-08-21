import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fetchRecord } from "~/collections/helpers/fetch-record";
import { PayloadRequestError } from "~/common/helpers/payload-client";
import { findRecordById } from "./find-record-by-id";

jest.mock("~/collections/helpers/fetch-record", () => ({
	fetchRecord: jest.fn(),
}));

beforeEach(() => {
	jest.clearAllMocks();
});

describe("findRecordById()", () => {
	it("returns the record the server recognized the id as", async () => {
		jest.mocked(fetchRecord).mockResolvedValue({ id: "r1", title: "Found" });

		await expect(
			findRecordById("https://cms.example.com", "jwt-token", "posts", "r1"),
		).resolves.toEqual({ id: "r1", title: "Found" });
		expect(fetchRecord).toHaveBeenCalledWith(
			"https://cms.example.com",
			"jwt-token",
			"posts",
			"r1",
		);
	});

	it("answers null when there is no such record, rather than failing the search", async () => {
		jest
			.mocked(fetchRecord)
			.mockRejectedValue(new PayloadRequestError("server", "not found", 404));

		await expect(
			findRecordById("https://cms.example.com", "jwt-token", "posts", "nope"),
		).resolves.toBeNull();
	});

	// Payload reports an unusable id as a 404 on some database adapters and as a
	// cast failure on others, so the status cannot be the test — both arrive as
	// the same kind, and both mean the typed string is not one of these ids.
	it("answers null when the id was refused rather than missing", async () => {
		jest
			.mocked(fetchRecord)
			.mockRejectedValue(new PayloadRequestError("server", "cast failed", 500));

		await expect(
			findRecordById("https://cms.example.com", "jwt-token", "posts", "12"),
		).resolves.toBeNull();
	});

	// a failure that says nothing about the typed string is not this helper's to
	// answer: it belongs to the search around it, which has a surface for it.
	it("propagates a connectivity failure rather than reading it as no match", async () => {
		const failure = new PayloadRequestError("network", "unreachable");
		jest.mocked(fetchRecord).mockRejectedValue(failure);

		await expect(
			findRecordById("https://cms.example.com", "jwt-token", "posts", "12"),
		).rejects.toBe(failure);
	});

	it("propagates a rejected token rather than reading it as no match", async () => {
		const failure = new PayloadRequestError("auth", "rejected", 403);
		jest.mocked(fetchRecord).mockRejectedValue(failure);

		await expect(
			findRecordById("https://cms.example.com", "jwt-token", "posts", "12"),
		).rejects.toBe(failure);
	});

	// nothing else in the app throws a bare Error across this boundary, but a
	// helper that decides by kind has to say what it does with one that carries
	// no kind at all.
	it("propagates a failure that is not a Payload request error", async () => {
		const failure = new TypeError("undefined is not a function");
		jest.mocked(fetchRecord).mockRejectedValue(failure);

		await expect(
			findRecordById("https://cms.example.com", "jwt-token", "posts", "12"),
		).rejects.toBe(failure);
	});
});
