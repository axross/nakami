import { queryOptions } from "@tanstack/react-query";
import { useAuthStore } from "~/auth/stores/auth-store";
import { fetchAccess } from "~/collections/helpers/fetch-access";
import { toCollectionList } from "~/collections/models/collection";

/**
 * The server + user a collection list is scoped to — its cache identity. Keying
 * on both means switching account or server refetches instead of showing
 * another session's collections.
 */
export interface CollectionListScope {
	readonly serverUrl: string;
	readonly userId: string;
}

/**
 * Query options for the signed-in server's readable, non-system collections.
 * Consume with `useQuery(getCollectionListQueryOptions(scope))`, gating on an
 * active session at the call site (`enabled`). The token is read fresh inside
 * the `queryFn` — it is not cache identity, so it stays out of the key and a
 * refresh doesn't fragment the cache.
 */
export function getCollectionListQueryOptions(scope: CollectionListScope) {
	return queryOptions({
		queryKey: ["collections", scope],
		queryFn: async () => {
			// A query factory holds no hooks: read the session imperatively.
			const session = useAuthStore.getState().session;
			if (session === null) {
				throw new Error("Cannot load collections without a session.");
			}

			const access = await fetchAccess(scope.serverUrl, session.token);
			return toCollectionList(access);
		},
	});
}
