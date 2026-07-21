import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import * as SecureStore from "expo-secure-store";
import { reportError } from "~/core/helpers/error-reporting";
import { readLastServerUrl, writeLastServerUrl } from "./last-server-url";

jest.mock("expo-secure-store", () => ({
	getItemAsync: jest.fn(),
	setItemAsync: jest.fn(),
}));

jest.mock("~/core/helpers/error-reporting", () => ({
	reportError: jest.fn(),
}));

const KEY = "payload-mobile.last-server-url";

beforeEach(() => {
	jest.clearAllMocks();
});

describe("readLastServerUrl", () => {
	it("returns the stored URL", async () => {
		jest
			.mocked(SecureStore.getItemAsync)
			.mockResolvedValue("https://cms.example.com");

		await expect(readLastServerUrl()).resolves.toBe("https://cms.example.com");
		expect(SecureStore.getItemAsync).toHaveBeenCalledWith(KEY);
	});

	it("returns null when nothing is stored", async () => {
		jest.mocked(SecureStore.getItemAsync).mockResolvedValue(null);

		await expect(readLastServerUrl()).resolves.toBeNull();
	});

	it("reports and returns null on a keychain read failure", async () => {
		const error = new Error("keychain unavailable");
		jest.mocked(SecureStore.getItemAsync).mockRejectedValue(error);

		await expect(readLastServerUrl()).resolves.toBeNull();
		expect(reportError).toHaveBeenCalledWith(error, expect.anything());
	});
});

describe("writeLastServerUrl", () => {
	it("persists the URL to its keychain entry", async () => {
		jest.mocked(SecureStore.setItemAsync).mockResolvedValue(undefined);

		await writeLastServerUrl("https://cms.example.com");

		expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
			KEY,
			"https://cms.example.com",
		);
	});

	it("reports and swallows a keychain write failure", async () => {
		const error = new Error("keychain unavailable");
		jest.mocked(SecureStore.setItemAsync).mockRejectedValue(error);

		await expect(
			writeLastServerUrl("https://cms.example.com"),
		).resolves.toBeUndefined();
		expect(reportError).toHaveBeenCalledWith(error, expect.anything());
	});
});
