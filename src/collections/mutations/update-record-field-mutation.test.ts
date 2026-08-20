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
import { updateRecordField } from "~/collections/helpers/update-record-field";
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

beforeEach(() => {
	jest.clearAllMocks();
	useAuthStore.setState({ status: "authenticated", session: SESSION });
});

afterEach(() => {
	useAuthStore.setState({ status: "unauthenticated", session: null });
});

describe("getUpdateRecordFieldMutationOptions", () => {
	it("keys on the record beneath the session root, with the verb last", () => {
		expect(getUpdateRecordFieldMutationOptions(SCOPE).mutationKey).toEqual([
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
		const { scope } = getUpdateRecordFieldMutationOptions(SCOPE);
		const sibling = getUpdateRecordFieldMutationOptions({
			...SCOPE,
			recordId: "a2",
		});
		const sameRecord = getUpdateRecordFieldMutationOptions({ ...SCOPE });

		expect(scope?.id).toBe(sameRecord.scope?.id);
		expect(scope?.id).not.toBe(sibling.scope?.id);
	});

	it("sends the one edited field with the session's server and token", async () => {
		const { mutationFn } = getUpdateRecordFieldMutationOptions(SCOPE);
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

		const { mutationFn } = getUpdateRecordFieldMutationOptions(SCOPE);
		if (typeof mutationFn !== "function") {
			throw new Error("expected a mutationFn");
		}

		await expect(
			mutationFn({ fieldName: "title", value: "Renamed" }, CONTEXT),
		).rejects.toThrow("Unexpected response (400).");
	});

	it("throws without sending when there is no session", async () => {
		useAuthStore.setState({ status: "unauthenticated", session: null });

		const { mutationFn } = getUpdateRecordFieldMutationOptions(SCOPE);
		if (typeof mutationFn !== "function") {
			throw new Error("expected a mutationFn");
		}

		await expect(
			mutationFn({ fieldName: "title", value: "Renamed" }, CONTEXT),
		).rejects.toThrow("Cannot save a field without a session.");
		expect(updateRecordField).not.toHaveBeenCalled();
	});
});
