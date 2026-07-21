import { describe, expect, it } from "@jest/globals";
import { accessResponseSchema, toCollectionList } from "./collection";

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
