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
import { getCollectionAccessQueryOptions } from "~/collections/queries/collection-access-query";
import { getCollectionListQueryOptions } from "./collection-list-query";

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

describe("getCollectionListQueryOptions", () => {
	it("keys the list beneath the session root", () => {
		expect(getCollectionListQueryOptions(SCOPE).queryKey).toEqual([
			"users",
			"user-1",
			"collections",
		]);
	});

	it("fetches against the session's server and token, caching the access map whole", async () => {
		const access = {
			collections: {
				posts: { read: true },
				media: { read: false },
				"payload-preferences": { read: true },
			},
		};
		jest.mocked(fetchAccess).mockResolvedValue(access);

		const { queryFn } = getCollectionListQueryOptions(SCOPE);
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
		// what is cached is the response, not the list: the record detail screen
		// reads the same entry for its per-field entries, which the list drops.
		expect(result).toEqual(access);
	});

	// the list is a view of that entry, applied on the way out.
	it("narrows the cached map to the readable, non-system collections", () => {
		const { select } = getCollectionListQueryOptions(SCOPE);
		if (typeof select !== "function") {
			throw new Error("expected a select");
		}

		expect(
			select({
				collections: {
					posts: { read: true },
					media: { read: false },
					"payload-preferences": { read: true },
				},
			}),
		).toEqual([{ slug: "posts", label: "Posts" }]);
	});

	// one key, one request: a detail screen opened from the list finds the access
	// map already cached rather than fetching it a second time.
	it("shares the access query's own key", () => {
		expect(getCollectionListQueryOptions(SCOPE).queryKey).toEqual(
			getCollectionAccessQueryOptions(SCOPE).queryKey,
		);
	});

	it("throws without fetching when there is no session", async () => {
		useAuthStore.setState({ status: "unauthenticated", session: null });

		const { queryFn } = getCollectionListQueryOptions(SCOPE);
		if (typeof queryFn !== "function") {
			throw new Error("expected a queryFn");
		}

		await expect(
			queryFn({} as unknown as Parameters<typeof queryFn>[0]),
		).rejects.toThrow("Cannot load collections without a session.");
		expect(fetchAccess).not.toHaveBeenCalled();
	});
});
