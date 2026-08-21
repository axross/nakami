import { recordPageSchema } from "~/collections/models/record";
import {
	parseResponse,
	request,
	serverBaseUrl,
} from "~/common/helpers/payload-client";

/**
 * how many records to request per page. a bounded page keeps each request and
 * the in-memory list small regardless of collection size; more pages load on
 * scroll (see the records query's infinite pagination).
 */
export const RECORDS_PAGE_SIZE = 25;

/**
 * what a page is filtered by: the text a reader typed, and the fields to look
 * for it in. the fields are the caller's to establish — Payload refuses a query
 * naming a field the collection does not configure, so they come from
 * {@link import("./searchable-fields").deriveSearchableFields} reading records
 * the server already returned, never from a guess.
 */
export interface RecordSearch {
	readonly query: string;
	readonly fields: readonly string[];
}

/**
 * builds the `where` half of the query string: each field asked for the same
 * text under `like`, all of them combined under `or`.
 *
 * `like` rather than `contains` because it is Payload's general text operator —
 * case-insensitive, and given several words it asks for all of them in any
 * order, which is what a search box means. How words are split belongs to the
 * database adapter, so a multi-word query behaves slightly differently against
 * a Mongo and a Postgres server; a single-word one behaves identically on both.
 *
 * an empty field list yields an empty string rather than an `or` with no
 * conditions, which Payload would answer by matching everything — the opposite
 * of what a search that can look nowhere should return. The caller is what
 * turns that into "no matches"; see the records query.
 */
function searchQueryString(search: RecordSearch): string {
	return search.fields
		.map(
			(field, index) =>
				`&where[or][${index}][${encodeURIComponent(field)}][like]=${encodeURIComponent(search.query)}`,
		)
		.join("");
}

/**
 * fetches one page of a collection's records from `GET {serverUrl}/api/{slug}`,
 * optionally filtered to the records matching `search`. `depth=0` keeps
 * relationships/uploads unpopulated (small payloads, no needless server-side
 * joins); pagination is 1-based. every failure — an unreachable server, a
 * rejected token, an error status, and a body that does not match the schema —
 * surfaces as a
 * {@link import("~/common/helpers/payload-client").PayloadRequestError}, like
 * the other Payload feature clients, so the records screen can branch on its
 * `kind`.
 *
 * called without `search` it builds exactly the URL it always did, so an
 * unfiltered feed's request is unchanged by this argument existing.
 */
export async function fetchRecords(
	serverUrl: string,
	token: string,
	slug: string,
	page: number,
	search?: RecordSearch,
) {
	const query = `depth=0&limit=${RECORDS_PAGE_SIZE}&page=${page}${
		search === undefined ? "" : searchQueryString(search)
	}`;
	const body = await request(
		"fetchRecords",
		`${serverBaseUrl(serverUrl)}/api/${encodeURIComponent(slug)}?${query}`,
		{
			method: "GET",
			headers: { Authorization: `JWT ${token}` },
		},
	);

	return parseResponse("fetchRecords", recordPageSchema, body);
}
