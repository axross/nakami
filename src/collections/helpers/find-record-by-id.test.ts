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

	// the lookup is speculative — the reader typed text, which may be nothing
	// like an id of the type this server uses — so every way it can fail means
	// "not an id", including the ways that are not a 404.
	it("answers null when the server could not be reached", async () => {
		jest
			.mocked(fetchRecord)
			.mockRejectedValue(new PayloadRequestError("network", "unreachable"));

		await expect(
			findRecordById("https://cms.example.com", "jwt-token", "posts", "12"),
		).resolves.toBeNull();
	});

	it("answers null when the id was rejected outright", async () => {
		jest
			.mocked(fetchRecord)
			.mockRejectedValue(new PayloadRequestError("server", "cast failed", 500));

		await expect(
			findRecordById("https://cms.example.com", "jwt-token", "posts", "12"),
		).resolves.toBeNull();
	});
});
