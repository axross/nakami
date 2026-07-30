import { describe, expect, it, jest } from "@jest/globals";
import { openDatabaseSync } from "expo-sqlite";
import { db } from "./client";

// jest-expo's auto-mock for the ExpoSQLite native module exposes that module's
// loose functions but no NativeDatabase constructor, so openDatabaseSync throws
// (`_ExpoSQLite.default.NativeDatabase is not a constructor`) the moment
// ./client is imported. Replace the package with a fake handle instead.
jest.mock("expo-sqlite", () => ({
	openDatabaseSync: jest.fn(() => ({})),
}));

// ./client logs at module scope, which reaches the error tracker through the
// logger's breadcrumb transport. Use the manual mock, as logging.test.ts does.
jest.mock("~/core/helpers/error-reporting");

// ./client has no importer in src/ (see that file), so this is the only thing
// that runs it. It covers the module's construction — that drizzle() still
// accepts the handle and yields a query builder, which is what would break when
// drizzle-orm is bumped, one of the fast-moving dependencies README.md lists.
// It deliberately does not cover data-layer behavior: the expo-sqlite mock
// above means no SQL is executed and the native open is never exercised. Real
// coverage arrives with the first table and its consumer.
describe("db", () => {
	it("opens the on-device database with change listening enabled", () => {
		expect(openDatabaseSync).toHaveBeenCalledWith("nakami.db", {
			enableChangeListener: true,
		});
	});

	it("exposes Drizzle's query builders over that database", () => {
		expect(typeof db.select).toBe("function");
		expect(typeof db.insert).toBe("function");
		expect(typeof db.delete).toBe("function");
	});
});
