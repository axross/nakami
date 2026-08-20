import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { PayloadRequestError } from "~/common/helpers/payload-client";
import { updateRecordField } from "./update-record-field";

function mockFetch(
	response: Partial<Response> & { json?: () => Promise<unknown> },
) {
	const fetchMock = jest.fn(async () => response as Response);
	(globalThis as { fetch: typeof fetch }).fetch =
		fetchMock as unknown as typeof fetch;
	return fetchMock;
}

/** saves one field against the mocked fetch, resolving with its outcome either way. */
function attemptSave(): Promise<unknown> {
	return updateRecordField(
		"https://cms.example.com",
		"jwt-token",
		"posts",
		"a1",
		"title",
		"Renamed",
	).catch((caught: unknown) => caught);
}

beforeEach(() => {
	jest.restoreAllMocks();
});

describe("updateRecordField()", () => {
	it("PATCHes the record with a body carrying only the edited field", async () => {
		const fetchMock = mockFetch({
			ok: true,
			status: 200,
			json: async () => ({
				message: "Updated successfully.",
				doc: { id: "a1" },
			}),
		});

		// trailing slash on the server URL is normalized away.
		await updateRecordField(
			"https://cms.example.com/",
			"jwt-token",
			"posts",
			"a1",
			"title",
			"Renamed",
		);

		const [url, init] = fetchMock.mock.calls[0] as unknown as [
			string,
			RequestInit,
		];
		expect(url).toBe("https://cms.example.com/api/posts/a1");
		expect(init.method).toBe("PATCH");
		expect((init.headers as Record<string, string>).Authorization).toBe(
			"JWT jwt-token",
		);
		expect((init.headers as Record<string, string>)["Content-Type"]).toBe(
			"application/json",
		);
		// the whole point of a partial update: every other field is omitted, so
		// the server keeps what it already had.
		expect(JSON.parse(String(init.body))).toEqual({ title: "Renamed" });
	});

	it("sends a null, a number, and an object as the one key they are", async () => {
		const fetchMock = mockFetch({
			ok: true,
			status: 200,
			json: async () => ({}),
		});

		await updateRecordField(
			"https://cms.example.com",
			"jwt-token",
			"posts",
			"a1",
			"meta",
			{ views: 3 },
		);

		const [, init] = fetchMock.mock.calls[0] as unknown as [
			string,
			RequestInit,
		];
		expect(JSON.parse(String(init.body))).toEqual({ meta: { views: 3 } });
	});

	it("reports an unreachable server as a network failure", async () => {
		const fetchMock = jest.fn(async () => {
			throw new TypeError("Network request failed");
		});
		(globalThis as { fetch: typeof fetch }).fetch =
			fetchMock as unknown as typeof fetch;

		const error = await attemptSave();

		expect(error).toBeInstanceOf(PayloadRequestError);
		expect((error as PayloadRequestError).kind).toBe("network");
	});

	it("reports a refusal as a server failure carrying its status", async () => {
		mockFetch({ ok: false, status: 400 });

		const error = await attemptSave();

		expect(error).toBeInstanceOf(PayloadRequestError);
		expect((error as PayloadRequestError).kind).toBe("server");
		expect((error as PayloadRequestError).status).toBe(400);
	});
});
