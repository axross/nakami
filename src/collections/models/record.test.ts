import { describe, expect, it } from "@jest/globals";
import { recordPageSchema, recordSchema, toRecordPage } from "./record";

describe("recordPageSchema + toRecordPage", () => {
	it("maps a page into records with derived titles and pagination", () => {
		const page = recordPageSchema.parse({
			docs: [
				{
					id: "a1",
					title: "First post",
					updatedAt: "2026-07-18T00:00:00.000Z",
				},
				{ id: "a2", name: "Second" },
			],
			totalDocs: 42,
			limit: 25,
			totalPages: 2,
			page: 1,
			hasNextPage: true,
			nextPage: 2,
		});

		expect(toRecordPage(page)).toEqual({
			records: [
				{
					id: "a1",
					title: "First post",
					hasTitle: true,
					updatedAt: Date.UTC(2026, 6, 18),
				},
				{ id: "a2", title: "Second", hasTitle: true, updatedAt: null },
			],
			totalDocs: 42,
			hasNextPage: true,
			nextPage: 2,
			searchableFields: ["title", "name"],
		});
	});

	it("normalizes a numeric id to a string and tolerates unknown fields", () => {
		const page = recordPageSchema.parse({
			docs: [{ id: 7, status: "draft", author: { id: 1 } }],
			totalDocs: 1,
			hasNextPage: false,
		});

		const [record] = toRecordPage(page).records;
		expect(record).toEqual({
			id: "7",
			title: "7",
			hasTitle: false,
			updatedAt: null,
		});
	});

	it("treats a missing/null nextPage as the last page", () => {
		const page = recordPageSchema.parse({
			docs: [],
			totalDocs: 0,
			hasNextPage: false,
			nextPage: null,
		});

		expect(toRecordPage(page)).toEqual({
			records: [],
			totalDocs: 0,
			hasNextPage: false,
			nextPage: null,
			searchableFields: [],
		});
	});

	it("leads the page with a record found by its id, and counts it", () => {
		const page = recordPageSchema.parse({
			docs: [{ id: "a1", title: "A field guide" }],
			totalDocs: 1,
			hasNextPage: false,
		});
		const idMatch = recordSchema.parse({ id: "a9", title: "Found by id" });

		const mapped = toRecordPage(page, idMatch);

		expect(mapped.records.map((record) => record.id)).toEqual(["a9", "a1"]);
		expect(mapped.totalDocs).toBe(2);
	});

	it("lists a record found both ways once, and counts it once", () => {
		const page = recordPageSchema.parse({
			docs: [{ id: "a1", title: "A field guide" }],
			totalDocs: 1,
			hasNextPage: false,
		});
		const idMatch = recordSchema.parse({ id: "a1", title: "A field guide" });

		const mapped = toRecordPage(page, idMatch);

		expect(mapped.records.map((record) => record.id)).toEqual(["a1"]);
		expect(mapped.totalDocs).toBe(1);
	});

	it("leaves the page as it is when no id matched", () => {
		const page = recordPageSchema.parse({
			docs: [{ id: "a1", title: "A field guide" }],
			totalDocs: 1,
			hasNextPage: false,
		});

		expect(toRecordPage(page, null)).toEqual(toRecordPage(page));
	});

	it("reports the title-ish fields its own documents carry", () => {
		const page = recordPageSchema.parse({
			docs: [{ id: "a1", slug: "a-field-guide", views: 12 }],
			totalDocs: 1,
			hasNextPage: false,
		});

		expect(toRecordPage(page).searchableFields).toEqual(["slug"]);
	});
});
