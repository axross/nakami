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
 * one field's access result inside a collection's `fields` entry. Payload
 * serializes it as a bare `true` when the account may do everything to the
 * field, or as an object carrying only the operations it may do — a denied
 * operation is the **absence** of its key rather than a `false`, so `update`
 * is optional here and its absence is what a denial looks like. the other
 * operations, and the nested `fields` entry a group or array field carries, are
 * tolerated (stripped).
 */
const fieldAccessSchema = z.union([
	z.boolean(),
	z.object({ update: operationAccessSchema.optional() }),
]);

/**
 * a collection's per-field access map. it collapses to a bare `true` on a
 * collection with no field-level restriction anywhere, and expands into an
 * object keyed by field name only once some restriction exists — which is why
 * it cannot be used to enumerate a collection's fields, and why the record's
 * own JSON is what the detail screen enumerates instead.
 */
const fieldsAccessSchema = z.union([
	z.boolean(),
	z.record(z.string(), fieldAccessSchema),
]);

/**
 * one collection entry in `GET /api/access`. `read` gates whether the user can
 * browse the collection and `update` whether anything in it can be saved, both
 * optional because an absent operation key is Payload's way of denying it —
 * treating the entry as not-readable or not-updatable rather than failing the
 * parse. the remaining operations are tolerated (stripped).
 */
const collectionAccessSchema = z.object({
	read: operationAccessSchema.optional(),
	update: operationAccessSchema.optional(),
	fields: fieldsAccessSchema.optional(),
});

type CollectionAccess = z.infer<typeof collectionAccessSchema>;

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
 * whether the account may save this one field of this one collection.
 *
 * the collection's own `update` grant is checked first, since a collection the
 * account cannot update has no updatable field in it whatever its `fields`
 * entry says. past that the entry is read in both the forms Payload emits: a
 * bare boolean covering every field at once, and the expanded map, where a
 * field is granted by a bare `true` or by an object carrying an `update` key
 * and denied by that key being absent — or by the field being absent from the
 * map altogether.
 *
 * a collection or a field absent from the response is denied rather than
 * assumed, so a response this app does not recognize leaves a row read-only
 * instead of offering an edit the server will refuse. a `fields` entry that is
 * absent entirely is the one exception: nothing is narrowing the collection's
 * own grant there, so that grant stands.
 */
export function canUpdateField(
	access: AccessResponse,
	slug: string,
	fieldName: string,
): boolean {
	const entry: CollectionAccess | undefined = access.collections[slug];

	if (entry === undefined || !grantsAccess(entry.update)) {
		return false;
	}

	const fields = entry.fields;

	if (fields === undefined) {
		return true;
	}

	if (typeof fields === "boolean") {
		return fields;
	}

	const field: z.infer<typeof fieldAccessSchema> | undefined =
		fields[fieldName];

	if (field === undefined) {
		return false;
	}

	return typeof field === "boolean" ? field : grantsAccess(field.update);
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
