import { describe, expect, it, jest } from "@jest/globals";
import { openDatabaseSync } from "expo-sqlite";
import { db } from "./client";

// jest-expo's auto-mock for the ExpoSQLite native module exposes that module's
// loose functions but no NativeDatabase constructor, so the real
// openDatabaseSync throws `_ExpoSQLite.default.NativeDatabase is not a
// constructor` when ./client calls it. override that one export over the real
// module — drizzle() only stores the handle at construction, so an empty object
// carries it. spreading the real module is safe here: the missing constructor
// is reached when openDatabaseSync runs, not when expo-sqlite is required.
jest.mock("expo-sqlite", () => ({
	...jest.requireActual<typeof import("expo-sqlite")>("expo-sqlite"),
	openDatabaseSync: jest.fn(() => ({})),
}));

// ./client logs at module scope, and the logger mirrors every line to the error
// tracker. use the manual mock, as logging.test.ts does.
jest.mock("~/core/helpers/error-reporting");

// nothing imports ./client but this file (see ./client.ts), so this is the only
// thing that runs it. what it covers is narrow: drizzle() still returns an
// object carrying the select, insert, update, and delete builders, so a
// drizzle-orm bump that drops or renames one turns this red — README.md lists
// Drizzle among the dependencies that move fast enough to need re-reading. a
// bump that keeps those names and changes what they build does not. it covers
// no data-layer behavior at all: the expo-sqlite mock above means no SQL runs
// and the native open is never exercised. that coverage arrives with the first
// table and its consumer.
//
// openDatabaseSync is called once, while ./client is imported, so the first
// case below reads a call recorded before any test body ran. clearing or
// resetting mocks between cases would turn it red for a reason that has nothing
// to do with the database.
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
