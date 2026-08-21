import { describe, expect, it } from "@jest/globals";
import { deriveSearchableFields } from "./searchable-fields";

describe("deriveSearchableFields()", () => {
	it("reports the title-ish fields the records carry a non-empty string under", () => {
		expect(
			deriveSearchableFields([
				{ id: "1", title: "A field guide", body: "…" },
				{ id: "2", title: "Another", slug: "another" },
			]),
		).toEqual(["title", "slug"]);
	});

	it("keeps the title vocabulary's own order regardless of key order", () => {
		expect(
			deriveSearchableFields([
				{ id: "1", email: "you@example.com", name: "Yo" },
			]),
		).toEqual(["name", "email"]);
	});

	it("reports a field carried by any record, not only by the first", () => {
		expect(
			deriveSearchableFields([
				{ id: "1", title: "Titled" },
				{ id: "2", name: "Named" },
			]),
		).toEqual(["title", "name"]);
	});

	it("skips a field that is not a string, so a query cannot ask `like` of a number", () => {
		expect(
			deriveSearchableFields([{ id: "1", label: 7, heading: { text: "…" } }]),
		).toEqual([]);
	});

	it("skips a field that is empty or blank on every record it appears on", () => {
		expect(
			deriveSearchableFields([
				{ id: "1", title: "" },
				{ id: "2", title: "   " },
			]),
		).toEqual([]);
	});

	it("names a field once even where every record carries it", () => {
		expect(
			deriveSearchableFields([
				{ id: "1", title: "One" },
				{ id: "2", title: "Two" },
			]),
		).toEqual(["title"]);
	});

	it("reports nothing for a collection whose records are outside the vocabulary", () => {
		expect(
			deriveSearchableFields([{ id: "1", headline: "Not a title field" }]),
		).toEqual([]);
	});

	it("reports nothing when there are no records to read", () => {
		expect(deriveSearchableFields([])).toEqual([]);
	});
});
