import { describe, expect, it } from "@jest/globals";
import { deriveRecordTitle, formatUpdatedLabel } from "./derive-record-title";

describe("deriveRecordTitle", () => {
	it("uses the first present title-ish field in priority order", () => {
		// `name` is present but `title` outranks it.
		expect(
			deriveRecordTitle({ id: "1", title: "Hello", name: "ignored" }),
		).toEqual({ title: "Hello", hasTitle: true });

		expect(deriveRecordTitle({ id: "1", name: "By name" })).toEqual({
			title: "By name",
			hasTitle: true,
		});

		expect(deriveRecordTitle({ id: "1", filename: "hero.jpg" })).toEqual({
			title: "hero.jpg",
			hasTitle: true,
		});
	});

	it("trims surrounding whitespace from the chosen title", () => {
		expect(deriveRecordTitle({ id: "1", title: "  Hello  " })).toEqual({
			title: "Hello",
			hasTitle: true,
		});
	});

	it("falls back to the id when no title-ish field exists", () => {
		expect(deriveRecordTitle({ id: "abc123", body: "no title here" })).toEqual({
			title: "abc123",
			hasTitle: false,
		});
	});

	it("skips non-string and empty title fields", () => {
		// `title` is a number, `name` is blank — neither counts; `label` wins.
		expect(
			deriveRecordTitle({ id: "1", title: 42, name: "   ", label: "Labelled" }),
		).toEqual({ title: "Labelled", hasTitle: true });

		// a relationship object under `title` is skipped, so it falls back.
		expect(deriveRecordTitle({ id: "1", title: { id: "rel" } })).toEqual({
			title: "1",
			hasTitle: false,
		});
	});
});

describe("formatUpdatedLabel", () => {
	it("formats an ISO date string in UTC", () => {
		expect(formatUpdatedLabel("2026-07-18T12:34:56.000Z")).toBe(
			"Updated 18 Jul 2026",
		);
	});

	it("returns null for a missing or non-string value", () => {
		expect(formatUpdatedLabel(undefined)).toBeNull();
		expect(formatUpdatedLabel(1_700_000_000)).toBeNull();
	});

	it("returns null for an unparseable date string", () => {
		expect(formatUpdatedLabel("not-a-date")).toBeNull();
	});
});
