import { describe, expect, it } from "@jest/globals";
import { deriveRecordTitle } from "./derive-record-title";

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
