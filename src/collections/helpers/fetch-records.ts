import { recordPageSchema } from "~/collections/models/record";
import { request, serverBaseUrl } from "~/common/helpers/payload-client";

/**
 * How many records to request per page. A bounded page keeps each request and
 * the in-memory list small regardless of collection size; more pages load on
 * scroll (see the records query's infinite pagination).
 */
export const RECORDS_PAGE_SIZE = 25;

/**
 * Fetches one page of a collection's records from `GET {serverUrl}/api/{slug}`.
 * `depth=0` keeps relationships/uploads unpopulated (small payloads, no
 * needless server-side joins); pagination is 1-based. Maps failures to a
 * {@link import("~/common/helpers/payload-client").PayloadRequestError}, like
 * the other Payload feature clients.
 */
export async function fetchRecords(
	serverUrl: string,
	token: string,
	slug: string,
	page: number,
) {
	const query = `depth=0&limit=${RECORDS_PAGE_SIZE}&page=${page}`;
	const body = await request(
		"fetchRecords",
		`${serverBaseUrl(serverUrl)}/api/${encodeURIComponent(slug)}?${query}`,
		{
			method: "GET",
			headers: { Authorization: `JWT ${token}` },
		},
	);

	return recordPageSchema.parse(body);
}
