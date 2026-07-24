import { infiniteQueryOptions } from "@tanstack/react-query";
import { useAuthStore } from "~/auth/stores/auth-store";
import { fetchRecords } from "~/collections/helpers/fetch-records";
import { toRecordPage } from "~/collections/models/record";

/**
 * The server + user + collection a record list is scoped to — its cache
 * identity. Keying on the server and user (as the collection list does) means
 * switching account or server refetches instead of showing another session's
 * records; the slug names which collection.
 */
export interface CollectionRecordsScope {
	readonly serverUrl: string;
	readonly userId: string;
	readonly slug: string;
}

/**
 * Infinite-query options for one collection's records, paginated for infinite
 * scroll. Consume with `useInfiniteQuery(getCollectionRecordsInfiniteQueryOptions(scope))`,
 * gating on an active session at the call site (`enabled`). The key mirrors the
 * REST path (`["collections", slug, "records", …]`) with the server/user scope
 * in the trailing object; the token is read fresh inside the `queryFn` (not
 * cache identity), exactly like the collection-list factory.
 */
export function getCollectionRecordsInfiniteQueryOptions(
	scope: CollectionRecordsScope,
) {
	return infiniteQueryOptions({
		queryKey: [
			"collections",
			scope.slug,
			"records",
			{ serverUrl: scope.serverUrl, userId: scope.userId },
		],
		queryFn: async ({ pageParam }) => {
			// A query factory holds no hooks: read the session imperatively.
			const session = useAuthStore.getState().session;
			if (session === null) {
				throw new Error("Cannot load records without a session.");
			}

			const page = await fetchRecords(
				scope.serverUrl,
				session.token,
				scope.slug,
				pageParam,
			);
			return toRecordPage(page);
		},
		initialPageParam: 1,
		getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
	});
}
