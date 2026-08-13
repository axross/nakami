import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { ZodError } from "zod";
import { PayloadRequestError } from "~/common/helpers/payload-client";
import { fetchRecords, RECORDS_PAGE_SIZE } from "./fetch-records";

function mockFetch(
	response: Partial<Response> & { json?: () => Promise<unknown> },
) {
	const fetchMock = jest.fn(async () => response as Response);
	(globalThis as { fetch: typeof fetch }).fetch =
		fetchMock as unknown as typeof fetch;
	return fetchMock;
}

/** Fetches page 1 against the mocked fetch, resolving with its outcome either way. */
function attemptFirstPage(): Promise<unknown> {
	return fetchRecords("https://cms.example.com", "jwt-token", "posts", 1).catch(
		(caught: unknown) => caught,
	);
}

beforeEach(() => {
	jest.restoreAllMocks();
});

describe("fetchRecords", () => {
	it("GETs the bounded, unpopulated page with the JWT header and parses it", async () => {
		const fetchMock = mockFetch({
			ok: true,
			status: 200,
			json: async () => ({
				docs: [{ id: 7, title: "Hello" }],
				totalDocs: 1,
				hasNextPage: false,
				nextPage: null,
			}),
		});

		// Trailing slash on the server URL is normalized away.
		const page = await fetchRecords(
			"https://cms.example.com/",
			"jwt-token",
			"posts",
			1,
		);

		expect(page.docs[0]?.id).toBe("7");
		const [url, init] = fetchMock.mock.calls[0] as unknown as [
			string,
			RequestInit,
		];
		expect(url).toBe(
			`https://cms.example.com/api/posts?depth=0&limit=${RECORDS_PAGE_SIZE}&page=1`,
		);
		expect(init.method).toBe("GET");
		expect((init.headers as Record<string, string>).Authorization).toBe(
			"JWT jwt-token",
		);
	});

	it("throws an auth error on 401", async () => {
		mockFetch({ ok: false, status: 401 });

		const error = await attemptFirstPage();

		expect(error).toBeInstanceOf(PayloadRequestError);
		expect((error as PayloadRequestError).kind).toBe("auth");
	});

	it("throws a server error when a 200 body does not match the schema", async () => {
		mockFetch({
			ok: true,
			status: 200,
			json: async () => ({ docs: "not an array", totalDocs: 1 }),
		});

		const error = await attemptFirstPage();

		expect(error).toBeInstanceOf(PayloadRequestError);
		expect((error as PayloadRequestError).kind).toBe("server");
		expect((error as PayloadRequestError).cause).toBeInstanceOf(ZodError);
	});
});
