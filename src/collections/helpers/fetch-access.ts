import { accessResponseSchema } from "~/collections/models/collection";
import { request, serverBaseUrl } from "~/common/helpers/payload-client";

/**
 * Fetches the current user's access map from `GET {serverUrl}/api/access`. This
 * endpoint is server-scoped (not collection-scoped), so it does not go through
 * the auth client's collection endpoint helper. Maps failures to a
 * {@link import("~/common/helpers/payload-client").PayloadRequestError}.
 */
export async function fetchAccess(serverUrl: string, token: string) {
	const body = await request(
		"fetchAccess",
		`${serverBaseUrl(serverUrl)}/api/access`,
		{
			method: "GET",
			headers: { Authorization: `JWT ${token}` },
		},
	);

	return accessResponseSchema.parse(body);
}
