import { recordSchema } from "~/collections/models/record";
import {
	parseResponse,
	request,
	serverBaseUrl,
} from "~/common/helpers/payload-client";

/**
 * fetches one record from `GET {serverUrl}/api/{slug}/{id}`. `depth=0` keeps
 * relationships and uploads unpopulated, so what comes back is the record's own
 * fields — which is exactly what the detail screen enumerates. every failure —
 * an unreachable server, a rejected token, an error status, and a body that
 * does not match the schema — surfaces as a
 * {@link import("~/common/helpers/payload-client").PayloadRequestError}, like
 * the other Payload feature clients, so the screen can branch on its `kind`.
 */
export async function fetchRecord(
	serverUrl: string,
	token: string,
	slug: string,
	recordId: string,
) {
	const path = `${encodeURIComponent(slug)}/${encodeURIComponent(recordId)}`;
	const body = await request(
		"fetchRecord",
		`${serverBaseUrl(serverUrl)}/api/${path}?depth=0`,
		{
			method: "GET",
			headers: { Authorization: `JWT ${token}` },
		},
	);

	return parseResponse("fetchRecord", recordSchema, body);
}
