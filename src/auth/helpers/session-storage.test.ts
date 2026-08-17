import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import * as SecureStore from "expo-secure-store";
import type { Session } from "~/auth/models/session";
import { reportError } from "~/core/helpers/error-reporting";
import { clearSession, readSession, writeSession } from "./session-storage";

jest.mock("expo-secure-store", () => ({
	getItemAsync: jest.fn(),
	setItemAsync: jest.fn(),
	deleteItemAsync: jest.fn(),
}));

jest.mock("~/core/helpers/error-reporting");

const KEY = "nakami.session";

const session: Session = {
	serverUrl: "https://cms.example.com",
	collectionSlug: "users",
	token: "jwt-token",
	exp: 1_800_000_000,
	user: { id: "1", email: "you@example.com" },
};

/** feeds the keychain read whatever the last keychain write stored. */
function replayStoredEntry(): void {
	const [, stored] = jest.mocked(SecureStore.setItemAsync).mock.calls[0] ?? [];
	jest.mocked(SecureStore.getItemAsync).mockResolvedValue(stored ?? null);
}

beforeEach(() => {
	jest.clearAllMocks();
	jest.mocked(SecureStore.setItemAsync).mockResolvedValue(undefined);
	jest.mocked(SecureStore.deleteItemAsync).mockResolvedValue(undefined);
});

describe("readSession()", () => {
	it("returns null when nothing is stored", async () => {
		jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);

		await expect(readSession()).resolves.toBeNull();
	});

	it("reports, clears, and returns null for an entry that is not JSON", async () => {
		jest.mocked(SecureStore.getItemAsync).mockResolvedValue("not json at all");

		await expect(readSession()).resolves.toBeNull();
		expect(reportError).toHaveBeenCalledTimes(1);
		expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(KEY);
	});

	it("reports, clears, and returns null for valid JSON of the wrong shape", async () => {
		jest
			.mocked(SecureStore.getItemAsync)
			.mockResolvedValue(JSON.stringify({ token: "jwt-token" }));

		await expect(readSession()).resolves.toBeNull();
		expect(reportError).toHaveBeenCalledTimes(1);
		expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(KEY);
	});
});

describe("writeSession()", () => {
	it("stores the session under its keychain entry", async () => {
		await writeSession(session);

		// the exact stored bytes, not merely "a string": this is the assertion
		// that would catch the write half starting to store a different shape
		// from the one the read half expects.
		expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
			KEY,
			JSON.stringify(session),
		);
	});
});

describe("the keychain round trip", () => {
	it("reads back a written session unchanged", async () => {
		await writeSession(session);
		replayStoredEntry();

		// deep equality across both halves of the boundary: were a normalizing
		// transform reintroduced into the session's user schema, the encode half
		// would throw here rather than quietly storing a value the read half
		// would rewrite.
		await expect(readSession()).resolves.toEqual(session);
	});
});

describe("clearSession()", () => {
	it("removes the keychain entry", async () => {
		await clearSession();

		expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(KEY);
	});
});
