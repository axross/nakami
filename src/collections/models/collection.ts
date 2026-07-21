import { z } from "zod";
import { humanizeSlug } from "~/collections/helpers/humanize-slug";

/**
 * A collection as the list UI needs it: the Payload slug and a display name
 * derived from it. Payload returns no admin labels over REST, so `label` is the
 * humanized slug.
 */
export interface Collection {
	readonly slug: string;
	readonly label: string;
}

/**
 * One collection entry in `GET /api/access`. Payload also returns
 * `create`/`update`/`delete`/`fields`; only `read` gates whether the user can
 * browse the collection, so the rest is tolerated (stripped). `read` is
 * optional so a shape without it is treated as not-readable rather than a parse
 * failure.
 */
const collectionAccessSchema = z.object({
	read: z.object({ permission: z.boolean() }).optional(),
});

/**
 * `GET /api/access` payload. `collections` is keyed by slug; `canAccessAdmin`
 * and `globals` are present in the response but unused here (stripped).
 */
export const accessResponseSchema = z.object({
	collections: z.record(z.string(), collectionAccessSchema),
});

export type AccessResponse = z.infer<typeof accessResponseSchema>;

// Payload's own internal collections (preferences, migrations, locked
// documents, jobs, folders) are all `payload-`-prefixed. REST does not expose
// the admin nav's `hidden` flag, so this prefix is the closest approximation.
function isSystemCollection(slug: string): boolean {
	return slug.startsWith("payload-");
}

/**
 * Derives the display list from an access response: the collections the user
 * can read, excluding Payload's internal system collections, each with a
 * humanized name, sorted alphabetically by that name.
 */
export function toCollectionList(access: AccessResponse): Collection[] {
	return Object.entries(access.collections)
		.filter(
			([slug, entry]) =>
				entry.read?.permission === true && !isSystemCollection(slug),
		)
		.map(([slug]) => ({ slug, label: humanizeSlug(slug) }))
		.sort((a, b) => a.label.localeCompare(b.label));
}
