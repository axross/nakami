import { queryOptions } from "@tanstack/react-query";
import { useAuthStore } from "~/auth/stores/auth-store";
import { fetchAccess } from "~/collections/helpers/fetch-access";
import { toCollectionList } from "~/collections/models/collection";
import { getSessionQueryKeyRoot } from "~/common/helpers/session-query-key";

/**
 * the session a collection list is scoped to — its cache identity. the user id
 * stands for the whole session (see {@link getSessionQueryKeyRoot}), so
 * switching account or server refetches instead of showing another session's
 * collections.
 */
export interface CollectionListScope {
	readonly userId: string;
}

/**
 * query options for the signed-in server's readable, non-system collections.
 * consume with `useQuery(getCollectionListQueryOptions(scope))`, gating on an
 * active session at the call site (`enabled`). the server URL and token are
 * read fresh inside the `queryFn` — neither is cache identity, so they stay out
 * of the key and a refresh doesn't fragment the cache.
 */
export function getCollectionListQueryOptions(scope: CollectionListScope) {
	return queryOptions({
		queryKey: [...getSessionQueryKeyRoot(scope.userId), "collections"],
		queryFn: async () => {
			// a query factory holds no hooks: read the session imperatively.
			const session = useAuthStore.getState().session;
			if (session === null) {
				throw new Error("Cannot load collections without a session.");
			}

			const access = await fetchAccess(session.serverUrl, session.token);
			return toCollectionList(access);
		},
	});
}
