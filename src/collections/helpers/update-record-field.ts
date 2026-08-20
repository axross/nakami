import { request, serverBaseUrl } from "~/common/helpers/payload-client";

/**
 * writes a single field of one record through
 * `PATCH {serverUrl}/api/{slug}/{id}`, with a body carrying that one key and
 * nothing else.
 *
 * Payload's update is a partial one — a field the body omits keeps whatever
 * value it already had — so sending one key is what keeps a save from reverting
 * another account's concurrent edit or clobbering a Rich Text field this app
 * cannot even render. a successful `PATCH` answers with the updated document
 * *wrapped* — `{"doc": {…}, "message": "Updated successfully."}`, measured
 * against a real 3.88.0 server — and nothing here consumes any of it: the row
 * keeps the value the user typed, and the caller patches that one field into
 * the cached record.
 *
 * @throws {import("~/common/helpers/payload-client").PayloadRequestError} on
 * every failure path, in the same three kinds every other Payload call in this
 * app reports — `"network"` when the device could not reach the server, which
 * is what tells a queued write to stay queued.
 */
export async function updateRecordField(
	serverUrl: string,
	token: string,
	slug: string,
	recordId: string,
	fieldName: string,
	value: unknown,
): Promise<void> {
	const path = `${encodeURIComponent(slug)}/${encodeURIComponent(recordId)}`;

	await request(
		"updateRecordField",
		`${serverBaseUrl(serverUrl)}/api/${path}`,
		{
			method: "PATCH",
			headers: {
				Authorization: `JWT ${token}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ [fieldName]: value }),
		},
	);
}
