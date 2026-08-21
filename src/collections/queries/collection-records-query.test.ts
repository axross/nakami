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
import { findRecordById } from "~/collections/helpers/find-record-by-id";
import { describeQueryKey } from "~/common/helpers/session-query-key";
import { getCollectionRecordsInfiniteQueryOptions } from "./collection-records-query";

jest.mock("~/collections/helpers/fetch-records", () => ({
	fetchRecords: jest.fn(),
}));

jest.mock("~/collections/helpers/find-record-by-id", () => ({
	findRecordById: jest.fn(),
}));

const SEARCH = { query: "release", fields: ["title"] };

/** runs a factory's `queryFn` for one page, failing loudly if there is none. */
function runQueryFn(
	options: ReturnType<typeof getCollectionRecordsInfiniteQueryOptions>,
	pageParam: number,
) {
	const { queryFn } = options;
	if (typeof queryFn !== "function") {
		throw new Error("expected an infinite queryFn");
	}

	return queryFn({ pageParam } as unknown as Parameters<typeof queryFn>[0]);
}

const SCOPE = {
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
	jest.mocked(findRecordById).mockResolvedValue(null);
	useAuthStore.setState({ status: "authenticated", session: SESSION });
});

afterEach(() => {
	useAuthStore.setState({ status: "unauthenticated", session: null });
});

describe("getCollectionRecordsInfiniteQueryOptions", () => {
	it("keys on the collection beneath the session root, mirroring the REST path", () => {
		expect(getCollectionRecordsInfiniteQueryOptions(SCOPE).queryKey).toEqual([
			"users",
			"user-1",
			"collections",
			"posts",
			"records",
		]);
	});

	it("advances to the server's nextPage, then stops on the last page", () => {
		const { getNextPageParam } =
			getCollectionRecordsInfiniteQueryOptions(SCOPE);
		const base = { records: [], totalDocs: 0, searchableFields: [] };

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

		// the server URL comes from the session, not from the scope — it
		// authenticates the request without identifying the data.
		expect(fetchRecords).toHaveBeenCalledWith(
			"https://cms.example.com",
			"jwt-token",
			"posts",
			3,
			undefined,
		);
		expect(result.records).toEqual([
			{ id: "5", title: "Mapped", hasTitle: true, updatedAt: null },
		]);
	});

	it("hangs a search off that key as an object, so no typed text can be reported", () => {
		const queryKey = getCollectionRecordsInfiniteQueryOptions({
			...SCOPE,
			search: SEARCH,
		}).queryKey;

		expect(queryKey).toEqual([
			"users",
			"user-1",
			"collections",
			"posts",
			"records",
			{ search: "release", fields: ["title"] },
		]);
		// what a failed query would report: the resource, and nothing a reader
		// typed into the field.
		expect(describeQueryKey(queryKey)).toBe(
			"users/*/collections/posts/records/?",
		);
	});

	// the searched fields are read off the unfiltered feed's own first page, so
	// they are not constant for a collection: a page that comes back different
	// yields a different set, and the same text asked of a different set is a
	// different question. a key holding only the text would answer the second
	// from the first's cache entry.
	it("separates two searches for the same text over different fields", () => {
		const overTitle = getCollectionRecordsInfiniteQueryOptions({
			...SCOPE,
			search: { query: "release", fields: ["title"] },
		}).queryKey;
		const overTitleAndName = getCollectionRecordsInfiniteQueryOptions({
			...SCOPE,
			search: { query: "release", fields: ["title", "name"] },
		}).queryKey;

		expect(overTitle).not.toEqual(overTitleAndName);
	});

	it("asks the server for the search, and merges an id match into the first page", async () => {
		jest.mocked(fetchRecords).mockResolvedValue({
			docs: [{ id: "5", title: "Release notes" }],
			totalDocs: 1,
			hasNextPage: false,
			nextPage: null,
		});
		jest.mocked(findRecordById).mockResolvedValue({ id: "9", title: "By id" });

		const result = await runQueryFn(
			getCollectionRecordsInfiniteQueryOptions({ ...SCOPE, search: SEARCH }),
			1,
		);

		expect(fetchRecords).toHaveBeenCalledWith(
			"https://cms.example.com",
			"jwt-token",
			"posts",
			1,
			SEARCH,
		);
		expect(findRecordById).toHaveBeenCalledWith(
			"https://cms.example.com",
			"jwt-token",
			"posts",
			"release",
		);
		expect(result.records.map((record) => record.id)).toEqual(["9", "5"]);
		expect(result.totalDocs).toBe(2);
	});

	// prepending it again on page 2 would list the same record twice.
	it("looks an id up on the first page only", async () => {
		jest.mocked(fetchRecords).mockResolvedValue({
			docs: [],
			totalDocs: 0,
			hasNextPage: false,
			nextPage: null,
		});

		await runQueryFn(
			getCollectionRecordsInfiniteQueryOptions({ ...SCOPE, search: SEARCH }),
			2,
		);

		expect(findRecordById).not.toHaveBeenCalled();
	});

	// a query with a space in it is a phrase rather than an id, and no id the
	// lookup would recognize contains one.
	it("does not look up an id for a query holding whitespace", async () => {
		jest.mocked(fetchRecords).mockResolvedValue({
			docs: [],
			totalDocs: 0,
			hasNextPage: false,
			nextPage: null,
		});

		await runQueryFn(
			getCollectionRecordsInfiniteQueryOptions({
				...SCOPE,
				search: { query: "release notes", fields: ["title"] },
			}),
			1,
		);

		expect(findRecordById).not.toHaveBeenCalled();
	});

	// Payload reads an `or` carrying no conditions as no filter at all, so the
	// request is not made: it would answer a search with the whole collection.
	it("matches nothing but an id when the collection has no searchable field", async () => {
		jest.mocked(findRecordById).mockResolvedValue({ id: "9", title: "By id" });

		const result = await runQueryFn(
			getCollectionRecordsInfiniteQueryOptions({
				...SCOPE,
				search: { query: "release", fields: [] },
			}),
			1,
		);

		expect(fetchRecords).not.toHaveBeenCalled();
		expect(result.records.map((record) => record.id)).toEqual(["9"]);
		expect(result.totalDocs).toBe(1);
	});

	it("does not look an id up for the unfiltered feed", async () => {
		jest.mocked(fetchRecords).mockResolvedValue({
			docs: [],
			totalDocs: 0,
			hasNextPage: false,
			nextPage: null,
		});

		await runQueryFn(getCollectionRecordsInfiniteQueryOptions(SCOPE), 1);

		expect(findRecordById).not.toHaveBeenCalled();
	});

	it("throws without fetching when there is no session", async () => {
		useAuthStore.setState({ status: "unauthenticated", session: null });

		const { queryFn } = getCollectionRecordsInfiniteQueryOptions(SCOPE);
		if (typeof queryFn !== "function") {
			throw new Error("expected an infinite queryFn");
		}

		await expect(
			queryFn({ pageParam: 1 } as unknown as Parameters<typeof queryFn>[0]),
		).rejects.toThrow("Cannot load records without a session.");
		expect(fetchRecords).not.toHaveBeenCalled();
	});
});
