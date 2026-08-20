import { z } from "zod";
import { deriveRecordTitle } from "~/collections/helpers/derive-record-title";
import { parseUpdatedAt } from "~/collections/helpers/format-updated-at";
import { deriveSearchableFields } from "~/collections/helpers/searchable-fields";

/**
 * one record (document) in a Payload collection, as returned by the `find`
 * endpoint with `depth=0` and, unwrapped, as the whole body of the `findByID`
 * endpoint (`GET /api/{collection}/{id}`). the shape is collection-specific and
 * unknown to the app, so only `id` is required (a string or number depending on
 * the DB adapter, normalized to a string, like {@link import("~/auth/models/session").PayloadUser}.id);
 * every other field is tolerated (kept, via the loose object) so the title
 * heuristic can read whatever title-ish fields the record happens to have and
 * the detail screen can list them all.
 *
 * one schema serves both endpoints because the document is the same either way
 * — they differ in what wraps it, which is what {@link recordPageSchema} adds.
 */
export const recordSchema = z.looseObject({
	id: z.union([z.string(), z.number()]).transform(String),
});

/** one parsed record document (see {@link recordSchema}). */
export type RecordDocument = z.infer<typeof recordSchema>;

/**
 * `GET /api/{collection}` paginated `find` response. Payload returns rich
 * pagination metadata; only the fields the list UI needs are declared (the rest
 * is stripped): the `docs` page, the total count for the header, and the
 * next-page cursor for infinite scroll. `nextPage` is `null` on the last page.
 */
export const recordPageSchema = z.object({
	docs: z.array(recordSchema),
	totalDocs: z.number(),
	hasNextPage: z.boolean(),
	nextPage: z.number().nullable().optional(),
});

/** the parsed, validated `find` response (see {@link recordPageSchema}). */
export type RecordPageResponse = z.infer<typeof recordPageSchema>;

/** a record as the list UI needs it: an id, a derived title, and a last-update time. */
export interface CollectionRecord {
	readonly id: string;
	/** derived display title — a title-ish field's value, or the id (see `hasTitle`). */
	readonly title: string;
	/** `false` when the title fell back to the id (no title-ish field existed). */
	readonly hasTitle: boolean;
	/**
	 * the record's `updatedAt` as epoch milliseconds, or `null` when the field is
	 * absent or unreadable. the *timestamp* travels rather than a formatted
	 * label, because the card's label is relative ("5 hours ago") and one baked
	 * in here would freeze in the query cache and go on reading as it did when
	 * the page was fetched.
	 */
	readonly updatedAt: number | null;
}

/** one page of records as the list UI needs it, plus the pagination cursor. */
export interface CollectionRecordPage {
	readonly records: CollectionRecord[];
	readonly totalDocs: number;
	readonly hasNextPage: boolean;
	/** next 1-based page number, or `null` on the last page. */
	readonly nextPage: number | null;
	/**
	 * the title-ish fields this page's own documents turned out to carry (see
	 * {@link deriveSearchableFields}) — what a search of this collection may ask
	 * the server about. it travels on the page because the documents it is read
	 * from do not: `records` above is the four-field view model, and by the time
	 * a caller holds one the keys are gone.
	 */
	readonly searchableFields: string[];
}

function toCollectionRecord(
	record: RecordPageResponse["docs"][number],
): CollectionRecord {
	const { title, hasTitle } = deriveRecordTitle(record);

	return {
		id: record.id,
		title,
		hasTitle,
		updatedAt: parseUpdatedAt(record.updatedAt),
	};
}

/**
 * maps a parsed `find` page into the view model the record list consumes.
 *
 * `idMatch` is the record an exact-id lookup found beside a search, and is
 * merged here rather than by the caller because merging means mapping — and
 * {@link toCollectionRecord}, which derives the title the card draws, is
 * private to this module. It leads the page, since a reader who typed an id
 * asked for that record and nothing else; it is dropped when the search already
 * returned it, so the same record cannot appear twice; and the total gains one
 * only in the case where it was not already counted. That total is the server's
 * own count of what the *search* matched, so a record found only by id is one
 * the count would otherwise miss.
 *
 * a page carrying an `idMatch` is by definition the first page — a later page
 * would prepend it again — and the records query is what holds it to that.
 */
export function toRecordPage(
	response: RecordPageResponse,
	idMatch?: RecordDocument | null,
): CollectionRecordPage {
	const records = response.docs.map(toCollectionRecord);
	const isAlreadyListed =
		idMatch != null && records.some((record) => record.id === idMatch.id);
	const found = idMatch != null && !isAlreadyListed;

	return {
		records: found ? [toCollectionRecord(idMatch), ...records] : records,
		totalDocs: response.totalDocs + (found ? 1 : 0),
		hasNextPage: response.hasNextPage,
		nextPage: response.nextPage ?? null,
		searchableFields: deriveSearchableFields(response.docs),
	};
}
