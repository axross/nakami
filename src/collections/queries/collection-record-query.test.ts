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
import { fetchRecord } from "~/collections/helpers/fetch-record";
import { getCollectionRecordQueryOptions } from "./collection-record-query";

jest.mock("~/collections/helpers/fetch-record", () => ({
	fetchRecord: jest.fn(),
}));

const SCOPE = {
	userId: "user-1",
	slug: "posts",
	recordId: "a1",
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

describe("getCollectionRecordQueryOptions", () => {
	it("keys on the record beneath its own collection's records, mirroring the REST path", () => {
		expect(getCollectionRecordQueryOptions(SCOPE).queryKey).toEqual([
			"users",
			"user-1",
			"collections",
			"posts",
			"records",
			"a1",
		]);
	});

	it("fetches the record with the session token and returns the parsed document", async () => {
		// fetchRecord is mocked, so it stands in for the already-parsed response.
		jest.mocked(fetchRecord).mockResolvedValue({ id: "a1", title: "Hello" });

		const { queryFn } = getCollectionRecordQueryOptions(SCOPE);
		if (typeof queryFn !== "function") {
			throw new Error("expected a queryFn");
		}

		const record = await queryFn(
			{} as unknown as Parameters<typeof queryFn>[0],
		);

		// the server URL comes from the session, not from the scope — it
		// authenticates the request without identifying the data.
		expect(fetchRecord).toHaveBeenCalledWith(
			"https://cms.example.com",
			"jwt-token",
			"posts",
			"a1",
		);
		expect(record).toEqual({ id: "a1", title: "Hello" });
	});

	it("throws without fetching when there is no session", async () => {
		useAuthStore.setState({ status: "unauthenticated", session: null });

		const { queryFn } = getCollectionRecordQueryOptions(SCOPE);
		if (typeof queryFn !== "function") {
			throw new Error("expected a queryFn");
		}

		await expect(
			queryFn({} as unknown as Parameters<typeof queryFn>[0]),
		).rejects.toThrow("Cannot load a record without a session.");
		expect(fetchRecord).not.toHaveBeenCalled();
	});
});
