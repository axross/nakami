import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	jest,
} from "@jest/globals";
import type { Session } from "~/auth/models/session";
import { useAuthStore } from "~/auth/stores/auth-store";
import { fetchAccess } from "~/collections/helpers/fetch-access";
import { accessResponseSchema } from "~/collections/models/collection";
import { getCollectionAccessQueryOptions } from "./collection-access-query";

jest.mock("~/collections/helpers/fetch-access", () => ({
	fetchAccess: jest.fn(),
}));

const SCOPE = { userId: "user-1" };

const SESSION: Session = {
	serverUrl: "https://cms.example.com",
	collectionSlug: "users",
	token: "jwt-token",
	exp: 9_999_999_999,
	user: { id: "user-1", email: "you@example.com" },
};

beforeEach(() => {
	jest.clearAllMocks();
	useAuthStore.setState({ status: "authenticated", session: SESSION });
});

afterEach(() => {
	useAuthStore.setState({ status: "unauthenticated", session: null });
});

describe("getCollectionAccessQueryOptions", () => {
	it("keys the access map beneath the session root", () => {
		expect(getCollectionAccessQueryOptions(SCOPE).queryKey).toEqual([
			"users",
			"user-1",
			"collections",
		]);
	});

	it("caches the response whole, so a per-field entry survives", async () => {
		const access = accessResponseSchema.parse({
			collections: {
				posts: {
					read: true,
					update: true,
					fields: { title: true, internalNote: { read: true } },
				},
			},
		});
		jest.mocked(fetchAccess).mockResolvedValue(access);

		const { queryFn } = getCollectionAccessQueryOptions(SCOPE);
		if (typeof queryFn !== "function") {
			throw new Error("expected a queryFn");
		}
		const result = await queryFn(
			{} as unknown as Parameters<typeof queryFn>[0],
		);

		// the server URL comes from the session, not from the scope — it
		// authenticates the request without identifying the data.
		expect(fetchAccess).toHaveBeenCalledWith(
			"https://cms.example.com",
			"jwt-token",
		);
		expect(result).toEqual(access);
	});

	it("throws without fetching when there is no session", async () => {
		useAuthStore.setState({ status: "unauthenticated", session: null });

		const { queryFn } = getCollectionAccessQueryOptions(SCOPE);
		if (typeof queryFn !== "function") {
			throw new Error("expected a queryFn");
		}

		await expect(
			queryFn({} as unknown as Parameters<typeof queryFn>[0]),
		).rejects.toThrow("Cannot load collections without a session.");
		expect(fetchAccess).not.toHaveBeenCalled();
	});
});
