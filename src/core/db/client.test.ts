import { describe, expect, it, jest } from "@jest/globals";
import { openDatabaseSync } from "expo-sqlite";
import { db } from "./client";

// jest-expo's auto-mock for the ExpoSQLite native module exposes that module's
// loose functions but no NativeDatabase constructor, so openDatabaseSync throws
// `_ExpoSQLite.default.NativeDatabase is not a constructor` the moment ./client
// is imported. Replace the package with a fake handle instead — drizzle() only
// stores the handle at construction, so an empty object carries it.
jest.mock("expo-sqlite", () => ({
	openDatabaseSync: jest.fn(() => ({})),
}));

// ./client logs at module scope, and the logger mirrors every line to the error
// tracker. Use the manual mock, as logging.test.ts does.
jest.mock("~/core/helpers/error-reporting");

// Nothing in src/ imports ./client (see that file), so this file is the only
// thing that runs it. What it covers is the module's construction: that
// drizzle() still accepts the handle and yields a query builder, which is the
// drift a drizzle-orm bump would cause — README.md lists Drizzle among the
// dependencies that move fast enough to need re-reading. It deliberately covers
// no data-layer behavior: the expo-sqlite mock above means no SQL runs and the
// native open is never exercised. That coverage arrives with the first table
// and its consumer.
describe("db", () => {
	it("opens the on-device database with change listening enabled", () => {
		expect(openDatabaseSync).toHaveBeenCalledWith("nakami.db", {
			enableChangeListener: true,
		});
	});

	it("exposes Drizzle's query builders over that database", () => {
		expect(typeof db.select).toBe("function");
		expect(typeof db.insert).toBe("function");
		expect(typeof db.update).toBe("function");
		expect(typeof db.delete).toBe("function");
	});
});
