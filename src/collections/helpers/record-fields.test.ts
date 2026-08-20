import { describe, expect, it } from "@jest/globals";
import {
	type AccessResponse,
	accessResponseSchema,
} from "~/collections/models/collection";
import { recordSchema } from "~/collections/models/record";
import { toRecordFields } from "./record-fields";

/** an access response granting update everywhere, so a case can vary one thing. */
const UNRESTRICTED: AccessResponse = accessResponseSchema.parse({
	collections: { posts: { read: true, update: true, fields: true } },
});

function fieldsOf(
	record: Record<string, unknown>,
	access: AccessResponse = UNRESTRICTED,
) {
	return toRecordFields({
		slug: "posts",
		record: recordSchema.parse(record),
		access,
	});
}

describe("toRecordFields()", () => {
	it("keeps the record's own key order, with id first", () => {
		const fields = fieldsOf({
			title: "Hello",
			publishedAt: null,
			id: "a1",
			views: 3,
		});

		expect(fields.map((field) => field.name)).toEqual([
			"id",
			"title",
			"publishedAt",
			"views",
		]);
	});

	// Payload's REST API publishes no admin label, so the name is all there is
	// to work with: it splits on word separators and on camelCase boundaries
	// alike, since a field name is an identifier rather than a slug.
	it("labels a field by humanizing its own name", () => {
		const [, blogAuthor, readingMinutes] = fieldsOf({
			id: "a1",
			blog_author: "Ada",
			readingMinutes: 7,
		});

		expect(blogAuthor).toMatchObject({
			name: "blog_author",
			label: "Blog Author",
		});
		expect(readingMinutes).toMatchObject({
			name: "readingMinutes",
			label: "Reading Minutes",
		});
	});

	it("infers a kind from the value's type, carrying the value through", () => {
		const fields = fieldsOf({
			id: "a1",
			title: "Hello",
			views: 3,
			isDraft: false,
			tags: ["a", "b"],
			meta: { views: 3 },
		});

		expect(fields.slice(1)).toEqual([
			{
				name: "title",
				label: "Title",
				value: "Hello",
				kind: "text",
				isEditable: true,
				readOnlyReason: null,
			},
			{
				name: "views",
				label: "Views",
				value: 3,
				kind: "number",
				isEditable: true,
				readOnlyReason: null,
			},
			{
				name: "isDraft",
				label: "Is Draft",
				value: false,
				kind: "boolean",
				isEditable: true,
				readOnlyReason: null,
			},
			{
				name: "tags",
				label: "Tags",
				value: ["a", "b"],
				kind: "json",
				isEditable: true,
				readOnlyReason: null,
			},
			{
				name: "meta",
				label: "Meta",
				value: { views: 3 },
				kind: "json",
				isEditable: true,
				readOnlyReason: null,
			},
		]);
	});

	it("locks a field holding no value, stating that it has none", () => {
		const [, publishedAt] = fieldsOf({ id: "a1", publishedAt: null });

		expect(publishedAt).toMatchObject({
			kind: "none",
			isEditable: false,
			readOnlyReason: "no-value",
		});
	});

	it("locks a Lexical document, stating that it is Rich Text", () => {
		const [, body] = fieldsOf({
			id: "a1",
			body: { root: { type: "root", children: [] } },
		});

		expect(body).toMatchObject({
			kind: "json",
			isEditable: false,
			readOnlyReason: "rich-text",
		});
	});

	// the recognition is deliberately narrow: an ordinary object that happens to
	// carry a `root` must stay editable rather than be locked out by resemblance.
	it.each([
		["a root of the wrong type", { root: { type: "paragraph", children: [] } }],
		["a root with no children array", { root: { type: "root", children: 3 } }],
		["a root that is not an object", { root: "root" }],
		["no root at all", { title: "Hello" }],
	])("leaves an object with %s editable as raw JSON", (_, value) => {
		const [, meta] = fieldsOf({ id: "a1", meta: value });

		expect(meta).toMatchObject({
			kind: "json",
			isEditable: true,
			readOnlyReason: null,
		});
	});

	it("locks the fields Payload assigns itself", () => {
		const fields = fieldsOf({
			id: "a1",
			createdAt: "2026-07-18T00:00:00.000Z",
			updatedAt: "2026-07-19T00:00:00.000Z",
			title: "Hello",
		});

		expect(
			fields
				.filter((field) => field.readOnlyReason === "server-assigned")
				.map((field) => field.name),
		).toEqual(["id", "createdAt", "updatedAt"]);
		expect(fields.at(-1)).toMatchObject({ name: "title", isEditable: true });
	});

	it("locks a field the access response denies update on, stating permission", () => {
		const access = accessResponseSchema.parse({
			collections: {
				posts: {
					update: true,
					fields: { title: true, slug: { read: true } },
				},
			},
		});

		const [, title, slug] = fieldsOf(
			{ id: "a1", title: "Hello", slug: "hello" },
			access,
		);

		expect(title).toMatchObject({ isEditable: true, readOnlyReason: null });
		expect(slug).toMatchObject({
			isEditable: false,
			readOnlyReason: "permission",
		});
	});

	it("locks every field of a collection denied update", () => {
		const access = accessResponseSchema.parse({
			collections: { posts: { read: true, fields: true } },
		});

		const fields = fieldsOf(
			{ id: "a1", title: "Hello", views: 3, body: null },
			access,
		);

		expect(fields.every((field) => !field.isEditable)).toBe(true);
		// the id stays what it is rather than reading as a permission problem.
		expect(fields.map((field) => field.readOnlyReason)).toEqual([
			"server-assigned",
			"permission",
			"permission",
			"permission",
		]);
	});
});
