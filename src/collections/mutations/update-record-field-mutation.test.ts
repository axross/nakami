import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	jest,
} from "@jest/globals";
import type { QueryClient } from "@tanstack/react-query";
import type { Session } from "~/auth/models/session";
import { useAuthStore } from "~/auth/stores/auth-store";
import { updateRecordField } from "~/collections/helpers/update-record-field";
import type { RecordDocument } from "~/collections/models/record";
import { getCollectionRecordQueryOptions } from "~/collections/queries/collection-record-query";
import { createTestQueryClient } from "~/common/test-helpers/query-client";
import { getUpdateRecordFieldMutationOptions } from "./update-record-field-mutation";

jest.mock("~/collections/helpers/update-record-field", () => ({
	updateRecordField: jest.fn(),
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

/**
 * the second argument TanStack Query hands a `mutationFn`. this factory reads
 * nothing off it, so a bare stand-in is enough to call the function directly.
 */
const CONTEXT = {} as Parameters<
	NonNullable<
		ReturnType<typeof getUpdateRecordFieldMutationOptions>["mutationFn"]
	>
>[1];

/**
 * a throwaway cache per test, as docs/conventions/server-state.md requires —
 * never the application's own client, which these options would otherwise
 * write into.
 */
let client: QueryClient;

/** the options under test, bound to this test's own cache. */
function optionsFor(scope = SCOPE) {
	return getUpdateRecordFieldMutationOptions(scope, client);
}

beforeEach(() => {
	jest.clearAllMocks();
	client = createTestQueryClient();
	useAuthStore.setState({ status: "authenticated", session: SESSION });
});

afterEach(() => {
	client.clear();
	useAuthStore.setState({ status: "unauthenticated", session: null });
});

describe("getUpdateRecordFieldMutationOptions", () => {
	it("keys on the record beneath the session root, with the verb last", () => {
		expect(optionsFor().mutationKey).toEqual([
			"users",
			"user-1",
			"collections",
			"posts",
			"records",
			"a1",
			"update",
		]);
	});

	// same scope id, one write at a time: this is what stops two blurs in quick
	// succession on one record from interleaving.
	it("scopes serialization to the record, so two records still run in parallel", () => {
		const { scope } = optionsFor();
		const sibling = optionsFor({ ...SCOPE, recordId: "a2" });
		const sameRecord = optionsFor({ ...SCOPE });

		expect(scope?.id).toBe(sameRecord.scope?.id);
		expect(scope?.id).not.toBe(sibling.scope?.id);
	});

	it("sends the one edited field with the session's server and token", async () => {
		const { mutationFn } = optionsFor();
		if (typeof mutationFn !== "function") {
			throw new Error("expected a mutationFn");
		}

		await mutationFn({ fieldName: "title", value: "Renamed" }, CONTEXT);

		expect(updateRecordField).toHaveBeenCalledWith(
			"https://cms.example.com",
			"jwt-token",
			"posts",
			"a1",
			"title",
			"Renamed",
		);
	});

	it("surfaces the transport's failure unwrapped, for the row to show", async () => {
		jest
			.mocked(updateRecordField)
			.mockRejectedValue(new Error("Unexpected response (400)."));

		const { mutationFn } = optionsFor();
		if (typeof mutationFn !== "function") {
			throw new Error("expected a mutationFn");
		}

		await expect(
			mutationFn({ fieldName: "title", value: "Renamed" }, CONTEXT),
		).rejects.toThrow("Unexpected response (400).");
	});

	it("throws without sending when there is no session", async () => {
		useAuthStore.setState({ status: "unauthenticated", session: null });

		const { mutationFn } = optionsFor();
		if (typeof mutationFn !== "function") {
			throw new Error("expected a mutationFn");
		}

		await expect(
			mutationFn({ fieldName: "title", value: "Renamed" }, CONTEXT),
		).rejects.toThrow("Cannot save a field without a session.");
		expect(updateRecordField).not.toHaveBeenCalled();
	});

	// a save that lands has to move the cached record, or the screen goes on
	// showing the old value in every input the user has not touched. only the
	// saved field moves, and nothing is invalidated: a refetch would replace what
	// is being typed into the other inputs.
	describe("onSuccess", () => {
		const { queryKey } = getCollectionRecordQueryOptions(SCOPE);
		const CACHED: RecordDocument = {
			id: "a1",
			title: "Original",
			views: 3,
		};

		function saved(fieldName: string, value: unknown) {
			const { onSuccess } = optionsFor();
			if (typeof onSuccess !== "function") {
				throw new Error("expected an onSuccess");
			}

			onSuccess(undefined, { fieldName, value }, undefined, CONTEXT);

			return client.getQueryData<RecordDocument>(queryKey);
		}

		it("patches the saved field into the cached record, leaving the rest", () => {
			client.setQueryData(queryKey, CACHED);

			expect(saved("title", "Renamed")).toEqual({
				id: "a1",
				title: "Renamed",
				views: 3,
			});
		});

		it("does not refetch the record", () => {
			client.setQueryData(queryKey, CACHED);

			saved("title", "Renamed");

			// an invalidated entry is what a refetch would come from; a patch leaves
			// the entry fresh, so nothing is scheduled against the inputs on screen.
			expect(client.getQueryState(queryKey)?.isInvalidated).toBe(false);
		});

		it("seeds nothing into a cache that holds no record", () => {
			expect(saved("title", "Renamed")).toBeUndefined();
		});
	});
});
