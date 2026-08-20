import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { ZodError } from "zod";
import { PayloadRequestError } from "~/common/helpers/payload-client";
import { fetchRecord } from "./fetch-record";

function mockFetch(
	response: Partial<Response> & { json?: () => Promise<unknown> },
) {
	const fetchMock = jest.fn(async () => response as Response);
	(globalThis as { fetch: typeof fetch }).fetch =
		fetchMock as unknown as typeof fetch;
	return fetchMock;
}

/** fetches one record against the mocked fetch, resolving with its outcome either way. */
function attemptRecord(): Promise<unknown> {
	return fetchRecord(
		"https://cms.example.com",
		"jwt-token",
		"posts",
		"a1",
	).catch((caught: unknown) => caught);
}

beforeEach(() => {
	jest.restoreAllMocks();
});

describe("fetchRecord()", () => {
	it("GETs the unpopulated record with the JWT header and parses it", async () => {
		const fetchMock = mockFetch({
			ok: true,
			status: 200,
			json: async () => ({ id: 7, title: "Hello", body: null }),
		});

		// trailing slash on the server URL is normalized away.
		const record = await fetchRecord(
			"https://cms.example.com/",
			"jwt-token",
			"posts",
			"7",
		);

		expect(record).toEqual({ id: "7", title: "Hello", body: null });
		const [url, init] = fetchMock.mock.calls[0] as unknown as [
			string,
			RequestInit,
		];
		expect(url).toBe("https://cms.example.com/api/posts/7?depth=0");
		expect(init.method).toBe("GET");
		expect((init.headers as Record<string, string>).Authorization).toBe(
			"JWT jwt-token",
		);
	});

	it("escapes a slug and an id that would otherwise reshape the path", async () => {
		const fetchMock = mockFetch({
			ok: true,
			status: 200,
			json: async () => ({ id: "a/b" }),
		});

		await fetchRecord(
			"https://cms.example.com",
			"jwt-token",
			"my posts",
			"a/b",
		);

		const [url] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
		expect(url).toBe("https://cms.example.com/api/my%20posts/a%2Fb?depth=0");
	});

	it("throws an auth error on 403", async () => {
		mockFetch({ ok: false, status: 403 });

		const error = await attemptRecord();

		expect(error).toBeInstanceOf(PayloadRequestError);
		expect((error as PayloadRequestError).kind).toBe("auth");
	});

	it("throws a server error when a 200 body carries no id", async () => {
		mockFetch({
			ok: true,
			status: 200,
			json: async () => ({ title: "Hello" }),
		});

		const error = await attemptRecord();

		expect(error).toBeInstanceOf(PayloadRequestError);
		expect((error as PayloadRequestError).kind).toBe("server");
		expect((error as PayloadRequestError).cause).toBeInstanceOf(ZodError);
	});
});
