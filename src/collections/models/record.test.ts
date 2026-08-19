import { describe, expect, it } from "@jest/globals";
import { recordPageSchema, toRecordPage } from "./record";

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
		});
	});
});
