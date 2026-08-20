import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import * as SecureStore from "expo-secure-store";
import type { StoredCredentials } from "~/auth/models/stored-credentials";
import { reportError } from "~/core/helpers/error-reporting";
import {
	clearCredentials,
	readCredentials,
	writeCredentials,
} from "./credentials-storage";

jest.mock("expo-secure-store", () => ({
	getItemAsync: jest.fn(),
	setItemAsync: jest.fn(),
	deleteItemAsync: jest.fn(),
	WHEN_UNLOCKED_THIS_DEVICE_ONLY: 4,
}));

jest.mock("~/core/helpers/error-reporting");

const KEY = "nakami.credentials";

const credentials: StoredCredentials = {
	serverUrl: "https://cms.example.com",
	collectionSlug: "users",
	email: "you@example.com",
	password: "password-that-must-not-be-logged",
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

describe("readCredentials()", () => {
	it("returns null when nothing is stored", async () => {
		jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);

		await expect(readCredentials()).resolves.toBeNull();
	});

	it("reports, clears, and returns null for an entry that is not JSON", async () => {
		jest.mocked(SecureStore.getItemAsync).mockResolvedValue("not json at all");

		await expect(readCredentials()).resolves.toBeNull();
		expect(reportError).toHaveBeenCalledTimes(1);
		expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(KEY);
	});

	it("reports, clears, and returns null for valid JSON of the wrong shape", async () => {
		jest
			.mocked(SecureStore.getItemAsync)
			.mockResolvedValue(JSON.stringify({ email: "you@example.com" }));

		await expect(readCredentials()).resolves.toBeNull();
		expect(reportError).toHaveBeenCalledTimes(1);
		expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(KEY);
	});
});

describe("writeCredentials()", () => {
	it("stores the credentials under their own keychain entry", async () => {
		await writeCredentials(credentials);

		// its own key rather than the session's: the two have different lifetimes
		// and different consent behind them, and this is the assertion that would
		// catch one being folded into the other.
		expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
			KEY,
			JSON.stringify(credentials),
			expect.anything(),
		);
	});

	// the one option this app sets on any keychain write, and the whole of what
	// keeps a password the user allowed *this device* to keep from being restored
	// onto another one out of an encrypted backup. it is invisible on any device
	// the suite can reach, so this assertion is the only guard it has.
	it("pins the entry to this device", async () => {
		await writeCredentials(credentials);

		expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
			KEY,
			expect.anything(),
			{ keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY },
		);
	});
});

describe("the keychain round trip", () => {
	it("reads back written credentials unchanged", async () => {
		await writeCredentials(credentials);
		replayStoredEntry();

		await expect(readCredentials()).resolves.toEqual(credentials);
	});
});

describe("clearCredentials()", () => {
	it("removes the keychain entry", async () => {
		await clearCredentials();

		expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(KEY);
	});
});
