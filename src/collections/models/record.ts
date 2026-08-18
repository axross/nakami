import { z } from "zod";
import { deriveRecordTitle } from "~/collections/helpers/derive-record-title";
import { parseUpdatedAt } from "~/collections/helpers/format-updated-at";

/**
 * one record (document) in a Payload collection, as returned by the `find`
 * endpoint with `depth=0`. the shape is collection-specific and unknown to the
 * app, so only `id` is required (a string or number depending on the DB
 * adapter, normalized to a string, like {@link import("~/auth/models/session").PayloadUser}.id);
 * every other field is tolerated (kept, via the loose object) so the title
 * heuristic can read whatever title-ish fields the record happens to have.
 */
export const recordSchema = z.looseObject({
	id: z.union([z.string(), z.number()]).transform(String),
});

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

/** maps a parsed `find` page into the view model the record list consumes. */
export function toRecordPage(
	response: RecordPageResponse,
): CollectionRecordPage {
	return {
		records: response.docs.map(toCollectionRecord),
		totalDocs: response.totalDocs,
		hasNextPage: response.hasNextPage,
		nextPage: response.nextPage ?? null,
	};
}
