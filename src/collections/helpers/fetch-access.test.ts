import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { PayloadRequestError } from "~/common/helpers/payload-client";
import { fetchAccess } from "./fetch-access";

function mockFetch(
	response: Partial<Response> & { json?: () => Promise<unknown> },
) {
	const fetchMock = jest.fn(async () => response as Response);
	(globalThis as { fetch: typeof fetch }).fetch =
		fetchMock as unknown as typeof fetch;
	return fetchMock;
}

beforeEach(() => {
	jest.restoreAllMocks();
});

describe("fetchAccess", () => {
	it("GETs the server access endpoint with the JWT header and parses collections", async () => {
		const fetchMock = mockFetch({
			ok: true,
			status: 200,
			json: async () => ({
				canAccessAdmin: true,
				collections: { posts: { read: { permission: true } } },
			}),
		});

		// Trailing slash on the server URL is normalized away.
		const access = await fetchAccess("https://cms.example.com/", "jwt-token");

		expect(access.collections.posts?.read).toEqual({ permission: true });
		const [url, init] = fetchMock.mock.calls[0] as unknown as [
			string,
			RequestInit,
		];
		expect(url).toBe("https://cms.example.com/api/access");
		expect(init.method).toBe("GET");
		expect((init.headers as Record<string, string>).Authorization).toBe(
			"JWT jwt-token",
		);
	});

	it("throws an auth error on 401", async () => {
		mockFetch({ ok: false, status: 401 });

		await expect(
			fetchAccess("https://cms.example.com", "stale-token"),
		).rejects.toMatchObject({ kind: "auth", status: 401 });
	});

	it("throws a network error when the request fails", async () => {
		const fetchMock = jest.fn(async () => {
			throw new Error("connection refused");
		});
		(globalThis as { fetch: typeof fetch }).fetch =
			fetchMock as unknown as typeof fetch;

		const error = await fetchAccess("https://cms.example.com", "token").catch(
			(caught) => caught,
		);

		expect(error).toBeInstanceOf(PayloadRequestError);
		expect((error as PayloadRequestError).kind).toBe("network");
	});
});
