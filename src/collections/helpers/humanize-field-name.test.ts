import { describe, expect, it } from "@jest/globals";
import { humanizeFieldName } from "./humanize-field-name";

describe("humanizeFieldName()", () => {
	it("title-cases a single word", () => {
		expect(humanizeFieldName("title")).toBe("Title");
	});

	// the whole reason this helper exists beside `humanizeSlug`: a field name is
	// an identifier, and the approved design renders it as separate words.
	it("splits and title-cases camelCase", () => {
		expect(humanizeFieldName("readingMinutes")).toBe("Reading Minutes");
	});

	it("splits a name carrying more than one camelCase boundary", () => {
		expect(humanizeFieldName("primaryCallToAction")).toBe(
			"Primary Call To Action",
		);
	});

	it("splits and title-cases kebab-case and snake_case", () => {
		expect(humanizeFieldName("blog-author")).toBe("Blog Author");
		expect(humanizeFieldName("created_at")).toBe("Created At");
	});

	it("splits a name mixing a separator with a camelCase boundary", () => {
		expect(humanizeFieldName("seo_metaTitle")).toBe("Seo Meta Title");
	});

	// title-casing only ever touches a word's first character, so an acronym
	// survives as one rather than being flattened to `Url`.
	it("keeps a trailing run of capitals together", () => {
		expect(humanizeFieldName("seoURL")).toBe("Seo URL");
	});

	it("keeps a leading run of capitals together", () => {
		expect(humanizeFieldName("HTMLContent")).toBe("HTML Content");
	});

	it("leaves a name that is one run of capitals alone", () => {
		expect(humanizeFieldName("URL")).toBe("URL");
	});

	it("title-cases the short server-assigned names", () => {
		expect(humanizeFieldName("id")).toBe("Id");
		expect(humanizeFieldName("createdAt")).toBe("Created At");
		expect(humanizeFieldName("updatedAt")).toBe("Updated At");
	});

	it("keeps a digit attached to the word it follows", () => {
		expect(humanizeFieldName("addressLine2")).toBe("Address Line2");
	});

	it("collapses repeated separators", () => {
		expect(humanizeFieldName("a--b__c")).toBe("A B C");
	});

	it("falls back to the name when it has no word characters", () => {
		expect(humanizeFieldName("--")).toBe("--");
	});
});
