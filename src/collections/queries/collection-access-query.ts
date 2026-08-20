import { queryOptions } from "@tanstack/react-query";
import { useAuthStore } from "~/auth/stores/auth-store";
import { fetchAccess } from "~/collections/helpers/fetch-access";
import { getSessionQueryKeyRoot } from "~/common/helpers/session-query-key";

/**
 * the session an access map is scoped to — its cache identity. the user id
 * stands for the whole session (see {@link getSessionQueryKeyRoot}), so
 * switching account or server refetches instead of answering with the
 * permissions of the account that signed out.
 */
export interface CollectionAccessScope {
	readonly userId: string;
}

/**
 * query options for `GET /api/access` as the server returns it. consume with
 * `useQuery(getCollectionAccessQueryOptions(scope))`, gating on an active
 * session at the call site (`enabled`). the server URL and token are read fresh
 * inside the `queryFn` — neither is cache identity, so they stay out of the key
 * and a refresh doesn't fragment the cache.
 *
 * this is the one place the access response is fetched, and both consumers read
 * this one cache entry: the collection list narrows it with a `select` (see
 * `getCollectionListQueryOptions`, which is these options plus that mapping),
 * and the record detail screen takes it whole, because deciding whether a field
 * is editable needs the per-field entries the list drops. one key, one request
 * — a screen opened from the list finds the map already there.
 */
export function getCollectionAccessQueryOptions(scope: CollectionAccessScope) {
	return queryOptions({
		queryKey: [...getSessionQueryKeyRoot(scope.userId), "collections"],
		queryFn: async () => {
			// a query factory holds no hooks: read the session imperatively.
			const session = useAuthStore.getState().session;
			if (session === null) {
				throw new Error("Cannot load collections without a session.");
			}

			return await fetchAccess(session.serverUrl, session.token);
		},
	});
}
