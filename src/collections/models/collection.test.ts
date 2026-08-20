import { describe, expect, it } from "@jest/globals";
import {
	accessResponseSchema,
	canUpdateField,
	toCollectionList,
} from "./collection";

describe("toCollectionList", () => {
	it("keeps readable non-system collections, humanized and sorted by name", () => {
		const access = accessResponseSchema.parse({
			collections: {
				posts: { read: { permission: true } },
				"blog-authors": { read: { permission: true } },
				media: { read: { permission: true } },
			},
		});

		expect(toCollectionList(access)).toEqual([
			{ slug: "blog-authors", label: "Blog Authors" },
			{ slug: "media", label: "Media" },
			{ slug: "posts", label: "Posts" },
		]);
	});

	it("accepts read as a bare boolean (unconditional access)", () => {
		const access = accessResponseSchema.parse({
			collections: {
				media: { read: true },
				drafts: { read: false },
			},
		});

		expect(
			toCollectionList(access).map((collection) => collection.slug),
		).toEqual(["media"]);
	});

	it("accepts read as a permission object with a where constraint", () => {
		const access = accessResponseSchema.parse({
			collections: {
				comments: {
					read: { permission: true, where: { status: { equals: "approved" } } },
				},
				secrets: { read: { permission: false } },
			},
		});

		expect(
			toCollectionList(access).map((collection) => collection.slug),
		).toEqual(["comments"]);
	});

	it("handles a response mixing boolean and object read shapes", () => {
		const access = accessResponseSchema.parse({
			collections: {
				media: { read: true },
				posts: { read: { permission: true } },
				pages: { read: false },
				"payload-preferences": { read: true },
			},
		});

		expect(toCollectionList(access)).toEqual([
			{ slug: "media", label: "Media" },
			{ slug: "posts", label: "Posts" },
		]);
	});

	it("excludes collections the user cannot read", () => {
		const access = accessResponseSchema.parse({
			collections: {
				posts: { read: { permission: true } },
				secrets: { read: { permission: false } },
				orphans: {},
			},
		});

		expect(
			toCollectionList(access).map((collection) => collection.slug),
		).toEqual(["posts"]);
	});

	it("excludes payload-* system collections but keeps the auth collection", () => {
		const access = accessResponseSchema.parse({
			collections: {
				users: { read: { permission: true } },
				"payload-preferences": { read: { permission: true } },
				"payload-migrations": { read: { permission: true } },
			},
		});

		expect(
			toCollectionList(access).map((collection) => collection.slug),
		).toEqual(["users"]);
	});

	it("tolerates unknown fields on the response and on entries", () => {
		const access = accessResponseSchema.parse({
			canAccessAdmin: true,
			globals: {},
			collections: {
				posts: {
					read: { permission: true },
					create: { permission: false },
					fields: {},
				},
			},
		});

		expect(toCollectionList(access)).toEqual([
			{ slug: "posts", label: "Posts" },
		]);
	});
});

describe("canUpdateField", () => {
	it("grants every field when the collection's fields entry collapses to true", () => {
		const access = accessResponseSchema.parse({
			collections: { posts: { update: true, fields: true } },
		});

		expect(canUpdateField(access, "posts", "title")).toBe(true);
		expect(canUpdateField(access, "posts", "anythingElse")).toBe(true);
	});

	// Payload writes a denial as the missing key rather than as `false`, at the
	// collection level as much as at the field level — which is why the reader
	// looks for the key rather than for a `false`.
	it("denies every field when the collection carries no update key", () => {
		const access = accessResponseSchema.parse({
			collections: {
				posts: { read: true, create: true, fields: true },
			},
		});

		expect(canUpdateField(access, "posts", "title")).toBe(false);
	});

	it("reads the expanded map, granting a field by true or by its update key", () => {
		const access = accessResponseSchema.parse({
			collections: {
				posts: {
					update: true,
					fields: {
						title: true,
						body: { create: true, read: true, update: true },
						slug: { create: true, read: true },
					},
				},
			},
		});

		expect(canUpdateField(access, "posts", "title")).toBe(true);
		expect(canUpdateField(access, "posts", "body")).toBe(true);
		expect(canUpdateField(access, "posts", "slug")).toBe(false);
	});

	it("reads a field's update as a permission object with a where constraint", () => {
		const access = accessResponseSchema.parse({
			collections: {
				posts: {
					update: { permission: true, where: { author: { equals: "me" } } },
					fields: {
						title: { update: { permission: true } },
						secret: { update: { permission: false } },
					},
				},
			},
		});

		expect(canUpdateField(access, "posts", "title")).toBe(true);
		expect(canUpdateField(access, "posts", "secret")).toBe(false);
	});

	it("denies a field the expanded map does not mention, and a collection it does not", () => {
		const access = accessResponseSchema.parse({
			collections: {
				posts: { update: true, fields: { title: true } },
			},
		});

		expect(canUpdateField(access, "posts", "body")).toBe(false);
		expect(canUpdateField(access, "pages", "title")).toBe(false);
	});

	it("lets the collection's own grant stand when no fields entry narrows it", () => {
		const access = accessResponseSchema.parse({
			collections: { posts: { update: true } },
		});

		expect(canUpdateField(access, "posts", "title")).toBe(true);
	});

	it("denies every field when the fields entry collapses to false", () => {
		const access = accessResponseSchema.parse({
			collections: { posts: { update: true, fields: false } },
		});

		expect(canUpdateField(access, "posts", "title")).toBe(false);
	});

	// one response feeds every collections surface, so a shape this app does not
	// recognize must not fail the parse: doing so would take the collection list
	// down over a field-permission entry it never reads. it denies instead.
	it.each<[string, unknown]>([
		["a bare string", "everything"],
		["a number", 1],
		["a map whose entry is neither a boolean nor an object", { title: "yes" }],
		[
			"a map whose entry carries an unreadable update",
			{ title: { update: 1 } },
		],
	])(
		"parses, and denies every field, for a fields entry that is %s",
		(_, fields) => {
			// `parse` rather than `safeParse`: the whole point is that it does not
			// throw, and a throw here fails the test with the parse error itself.
			const access = accessResponseSchema.parse({
				collections: { posts: { read: true, update: true, fields } },
			});

			expect(canUpdateField(access, "posts", "title")).toBe(false);
			// the list this response also feeds is untouched by the bad entry.
			expect(toCollectionList(access)).toEqual([
				{ slug: "posts", label: "Posts" },
			]);
		},
	);

	// the same regression, one key over: `update` was an unmodelled key before
	// this reader existed and could not fail a parse either.
	it("parses, and denies every field, for an update entry it cannot read", () => {
		const access = accessResponseSchema.parse({
			collections: { posts: { read: true, update: "maybe", fields: true } },
		});

		expect(canUpdateField(access, "posts", "title")).toBe(false);
		expect(toCollectionList(access)).toEqual([
			{ slug: "posts", label: "Posts" },
		]);
	});

	it("tolerates a field entry carrying operations and a nested fields map", () => {
		const access = accessResponseSchema.parse({
			collections: {
				posts: {
					update: true,
					fields: {
						meta: {
							create: true,
							read: true,
							update: true,
							fields: { description: { update: true } },
						},
					},
				},
			},
		});

		expect(canUpdateField(access, "posts", "meta")).toBe(true);
	});
});
