import { infiniteQueryOptions } from "@tanstack/react-query";
import { useAuthStore } from "~/auth/stores/auth-store";
import { fetchRecords } from "~/collections/helpers/fetch-records";
import { toRecordPage } from "~/collections/models/record";
import { getSessionQueryKeyRoot } from "~/common/helpers/session-query-key";

/**
 * The session + collection a record list is scoped to — its cache identity. The
 * user id stands for the whole session (see {@link getSessionQueryKeyRoot}), as
 * it does for the collection list; the slug names which collection.
 */
export interface CollectionRecordsScope {
	readonly userId: string;
	readonly slug: string;
}

/**
 * Infinite-query options for one collection's records, paginated for infinite
 * scroll. Consume with `useInfiniteQuery(getCollectionRecordsInfiniteQueryOptions(scope))`,
 * gating on an active session at the call site (`enabled`). The key mirrors the
 * REST path beneath the session root; the server URL and token are read fresh
 * inside the `queryFn` (neither is cache identity), exactly like the
 * collection-list factory.
 */
export function getCollectionRecordsInfiniteQueryOptions(
	scope: CollectionRecordsScope,
) {
	return infiniteQueryOptions({
		queryKey: [
			...getSessionQueryKeyRoot(scope.userId),
			"collections",
			scope.slug,
			"records",
		],
		queryFn: async ({ pageParam }) => {
			// A query factory holds no hooks: read the session imperatively.
			const session = useAuthStore.getState().session;
			if (session === null) {
				throw new Error("Cannot load records without a session.");
			}

			const page = await fetchRecords(
				session.serverUrl,
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
