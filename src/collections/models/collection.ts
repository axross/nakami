import { z } from "zod";
import { humanizeSlug } from "~/collections/helpers/humanize-slug";

/**
 * a collection as the list UI needs it: the Payload slug and a display name
 * derived from it. Payload returns no admin labels over REST, so `label` is the
 * humanized slug.
 */
export interface Collection {
	readonly slug: string;
	readonly label: string;
}

/**
 * one operation's access result in `GET /api/access`. Payload serializes it as
 * a bare boolean when access is unconditional (`"read": true`), or as
 * `{ permission, where }` when a constraint applies; the constraint (`where`, …)
 * is tolerated (stripped) since only the boolean verdict matters here.
 */
const operationAccessSchema = z.union([
	z.boolean(),
	z.object({ permission: z.boolean() }),
]);

type OperationAccess = z.infer<typeof operationAccessSchema>;

/**
 * one collection entry in `GET /api/access`. only `read` gates whether the user
 * can browse the collection; the other operations and `fields` are tolerated
 * (stripped). `read` is optional so an entry without it is treated as
 * not-readable rather than a parse failure.
 */
const collectionAccessSchema = z.object({
	read: operationAccessSchema.optional(),
});

/**
 * `GET /api/access` payload. `collections` is keyed by slug; `canAccessAdmin`
 * and `globals` are present in the response but unused here (stripped).
 */
export const accessResponseSchema = z.object({
	collections: z.record(z.string(), collectionAccessSchema),
});

/** the parsed, validated `GET /api/access` response (see accessResponseSchema). */
export type AccessResponse = z.infer<typeof accessResponseSchema>;

// Payload's own internal collections (preferences, migrations, locked
// documents, jobs, folders) are all `payload-`-prefixed. REST does not expose
// the admin nav's `hidden` flag, so this prefix is the closest approximation.
function isSystemCollection(slug: string): boolean {
	return slug.startsWith("payload-");
}

/** whether an operation-access result grants the user access. */
function grantsAccess(access: OperationAccess | undefined): boolean {
	return access === true || (typeof access === "object" && access.permission);
}

/**
 * derives the display list from an access response: the collections the user
 * can read, excluding Payload's internal system collections, each with a
 * humanized name, sorted alphabetically by that name.
 */
export function toCollectionList(access: AccessResponse): Collection[] {
	return Object.entries(access.collections)
		.filter(
			([slug, entry]) => grantsAccess(entry.read) && !isSystemCollection(slug),
		)
		.map(([slug]) => ({ slug, label: humanizeSlug(slug) }))
		.sort((a, b) => a.label.localeCompare(b.label));
}
