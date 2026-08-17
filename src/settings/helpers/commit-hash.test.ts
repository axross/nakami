import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import Constants from "expo-constants";
import { getCommitHash } from "./commit-hash";

jest.mock("expo-constants", () => ({
	__esModule: true,
	default: { expoConfig: { extra: {} } },
}));

/**
 * sets the value the mocked Expo config exposes at
 * `Constants.expoConfig.extra.commitHash`, standing in for what
 * `app.config.ts` bakes in at build time.
 */
function setEmbeddedCommitHash(value: unknown): void {
	const extra = Constants.expoConfig?.extra;
	if (extra) {
		extra.commitHash = value;
	}
}

describe("getCommitHash()", () => {
	beforeEach(() => {
		setEmbeddedCommitHash(undefined);
	});

	it("returns the short 7-character form of an embedded commit hash", () => {
		setEmbeddedCommitHash("9b05d813f387ab0431d253c8540ef2698dffe21c");

		expect(getCommitHash()).toBe("9b05d81");
	});

	it("returns Unknown when no commit hash is embedded", () => {
		expect(getCommitHash()).toBe("Unknown");
	});

	it("returns Unknown when the embedded value is an empty string", () => {
		setEmbeddedCommitHash("");

		expect(getCommitHash()).toBe("Unknown");
	});

	it("returns Unknown when the embedded value is not a string", () => {
		setEmbeddedCommitHash(42);

		expect(getCommitHash()).toBe("Unknown");
	});
});
