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
import { fetchRecords } from "~/collections/helpers/fetch-records";
import { getCollectionRecordsInfiniteQueryOptions } from "./collection-records-query";

jest.mock("~/collections/helpers/fetch-records", () => ({
	fetchRecords: jest.fn(),
}));

const SCOPE = {
	serverUrl: "https://cms.example.com",
	userId: "user-1",
	slug: "posts",
};

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

describe("getCollectionRecordsInfiniteQueryOptions", () => {
	it("keys on the collection and scope, mirroring the REST path", () => {
		expect(getCollectionRecordsInfiniteQueryOptions(SCOPE).queryKey).toEqual([
			"collections",
			"posts",
			"records",
			{ serverUrl: "https://cms.example.com", userId: "user-1" },
		]);
	});

	it("advances to the server's nextPage, then stops on the last page", () => {
		const { getNextPageParam } =
			getCollectionRecordsInfiniteQueryOptions(SCOPE);
		const base = { records: [], totalDocs: 0 };

		expect(
			getNextPageParam({ ...base, hasNextPage: true, nextPage: 2 }, [], 1, []),
		).toBe(2);
		expect(
			getNextPageParam(
				{ ...base, hasNextPage: false, nextPage: null },
				[],
				2,
				[],
			),
		).toBeUndefined();
	});

	it("fetches the requested page with the session token and maps the result", async () => {
		// fetchRecords is mocked, so it stands in for the already-parsed response
		// (its `id` is the string the schema normalizes to).
		jest.mocked(fetchRecords).mockResolvedValue({
			docs: [{ id: "5", title: "Mapped" }],
			totalDocs: 1,
			hasNextPage: false,
			nextPage: null,
		});

		const { queryFn } = getCollectionRecordsInfiniteQueryOptions(SCOPE);
		if (typeof queryFn !== "function") {
			throw new Error("expected an infinite queryFn");
		}
		const result = await queryFn({
			pageParam: 3,
		} as unknown as Parameters<typeof queryFn>[0]);

		expect(fetchRecords).toHaveBeenCalledWith(
			"https://cms.example.com",
			"jwt-token",
			"posts",
			3,
		);
		expect(result.records).toEqual([
			{ id: "5", title: "Mapped", hasTitle: true, updatedLabel: null },
		]);
	});
});
