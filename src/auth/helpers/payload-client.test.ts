import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { ZodError } from "zod";
import {
	fetchMe,
	login,
	PayloadRequestError,
	refreshToken,
} from "./payload-client";

const server = {
	serverUrl: "https://cms.example.com",
	collectionSlug: "users",
};

function mockFetch(
	response: Partial<Response> & { json?: () => Promise<unknown> },
) {
	const fetchMock = jest.fn(async () => response as Response);
	(globalThis as { fetch: typeof fetch }).fetch =
		fetchMock as unknown as typeof fetch;
	return fetchMock;
}

/** Signs in against the mocked fetch, resolving with its outcome either way. */
function attemptSignIn(): Promise<unknown> {
	return login(server, { email: "you@example.com", password: "secret" }).catch(
		(caught: unknown) => caught,
	);
}

beforeEach(() => {
	jest.restoreAllMocks();
});

describe("login", () => {
	it("POSTs credentials to the collection login endpoint and parses the session", async () => {
		const fetchMock = mockFetch({
			ok: true,
			status: 200,
			json: async () => ({
				user: { id: "1", email: "you@example.com" },
				token: "jwt-token",
				exp: 1_800_000_000,
			}),
		});

		const result = await login(server, {
			email: "you@example.com",
			password: "secret",
		});

		expect(result.token).toBe("jwt-token");
		const [url, init] = fetchMock.mock.calls[0] as unknown as [
			string,
			RequestInit,
		];
		expect(url).toBe("https://cms.example.com/api/users/login");
		expect(init.method).toBe("POST");
		expect(JSON.parse(init.body as string)).toEqual({
			email: "you@example.com",
			password: "secret",
		});
	});

	it("throws an auth error on 401", async () => {
		mockFetch({ ok: false, status: 401 });

		await expect(
			login(server, { email: "you@example.com", password: "wrong" }),
		).rejects.toMatchObject({ kind: "auth", status: 401 });
	});

	it("throws a network error when the request fails", async () => {
		const fetchMock = jest.fn(async () => {
			throw new Error("connection refused");
		});
		(globalThis as { fetch: typeof fetch }).fetch =
			fetchMock as unknown as typeof fetch;

		await expect(
			login(server, { email: "you@example.com", password: "secret" }),
		).rejects.toMatchObject({ kind: "network" });
	});

	it("throws a server error on an unexpected status", async () => {
		mockFetch({ ok: false, status: 500 });

		const error = await login(server, {
			email: "you@example.com",
			password: "secret",
		}).catch((caught) => caught);

		expect(error).toBeInstanceOf(PayloadRequestError);
		expect((error as PayloadRequestError).kind).toBe("server");
	});

	it("throws a server error when a 200 body does not match the schema", async () => {
		mockFetch({
			ok: true,
			status: 200,
			json: async () => ({ notALoginResponse: true }),
		});

		const error = await attemptSignIn();

		expect(error).toBeInstanceOf(PayloadRequestError);
		expect((error as PayloadRequestError).kind).toBe("server");
		expect((error as PayloadRequestError).cause).toBeInstanceOf(ZodError);
	});

	it.each(["", "not an email"])(
		"throws a server error when the user email is %p",
		async (email) => {
			mockFetch({
				ok: true,
				status: 200,
				json: async () => ({
					user: { id: "1", email },
					token: "jwt-token",
					exp: 1_800_000_000,
				}),
			});

			const error = await attemptSignIn();

			expect(error).toBeInstanceOf(PayloadRequestError);
			expect((error as PayloadRequestError).kind).toBe("server");
		},
	);
});

describe("fetchMe", () => {
	it("sends the JWT authorization header and returns a null user for a rejected token", async () => {
		const fetchMock = mockFetch({
			ok: true,
			status: 200,
			json: async () => ({ user: null }),
		});

		const result = await fetchMe(server, "stale-token");

		expect(result.user).toBeNull();
		const [url, init] = fetchMock.mock.calls[0] as unknown as [
			string,
			RequestInit,
		];
		expect(url).toBe("https://cms.example.com/api/users/me");
		expect((init.headers as Record<string, string>).Authorization).toBe(
			"JWT stale-token",
		);
	});
});

describe("refreshToken", () => {
	it("returns the refreshed token", async () => {
		mockFetch({
			ok: true,
			status: 200,
			json: async () => ({
				user: { id: "1", email: "you@example.com" },
				refreshedToken: "new-token",
				exp: 1_900_000_000,
			}),
		});

		const result = await refreshToken(server, "old-token");

		expect(result.refreshedToken).toBe("new-token");
	});
});
