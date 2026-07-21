import { describe, expect, it } from "@jest/globals";
import { humanizeSlug } from "./humanize-slug";

describe("humanizeSlug", () => {
	it("title-cases a single word", () => {
		expect(humanizeSlug("posts")).toBe("Posts");
	});

	it("splits and title-cases kebab-case", () => {
		expect(humanizeSlug("blog-posts")).toBe("Blog Posts");
	});

	it("splits and title-cases snake_case", () => {
		expect(humanizeSlug("media_items")).toBe("Media Items");
	});

	it("collapses repeated separators", () => {
		expect(humanizeSlug("a--b__c")).toBe("A B C");
	});

	it("falls back to the slug when it has no word characters", () => {
		expect(humanizeSlug("--")).toBe("--");
	});
});
