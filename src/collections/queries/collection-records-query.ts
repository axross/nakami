import { infiniteQueryOptions } from "@tanstack/react-query";
import { useAuthStore } from "~/auth/stores/auth-store";
import type { RecordSearch } from "~/collections/helpers/fetch-records";
import { fetchRecords } from "~/collections/helpers/fetch-records";
import { findRecordById } from "~/collections/helpers/find-record-by-id";
import { toRecordPage } from "~/collections/models/record";
import { getSessionQueryKeyRoot } from "~/common/helpers/session-query-key";

/**
 * the session + collection a record list is scoped to — its cache identity. the
 * user id stands for the whole session (see {@link getSessionQueryKeyRoot}), as
 * it does for the collection list; the slug names which collection.
 *
 * `search` narrows that list to what a reader typed. it is part of the identity
 * — a different query is different data — and absent for the unfiltered feed,
 * which keeps exactly the key and the request it had before search existed.
 */
export interface CollectionRecordsScope {
	readonly userId: string;
	readonly slug: string;
	readonly search?: RecordSearch;
}

/**
 * an unfiltered feed's key: the REST path beneath the session root.
 *
 * a search hangs one more segment off it, and that segment is an **object**
 * rather than the query text. `describeQueryKey` writes a string segment into a
 * failure report verbatim and reduces anything else to `?`, so this is what
 * keeps what someone typed — which can be anything, a record id included — out
 * of the error tracker while still giving each query its own cache entry.
 */
function recordsQueryKey(scope: CollectionRecordsScope) {
	const root = [
		...getSessionQueryKeyRoot(scope.userId),
		"collections",
		scope.slug,
		"records",
	] as const;

	return scope.search === undefined
		? root
		: ([...root, { search: scope.search.query }] as const);
}

/**
 * infinite-query options for one collection's records, paginated for infinite
 * scroll and optionally narrowed to a search. consume with
 * `useInfiniteQuery(getCollectionRecordsInfiniteQueryOptions(scope))`, gating on
 * an active session at the call site (`enabled`). the server URL and token are
 * read fresh inside the `queryFn` (neither is cache identity), exactly like the
 * collection-list factory.
 *
 * a search runs as two requests rather than one, and only the first is a query
 * the server can refuse: the field search, and — on the first page of a query
 * holding no whitespace — an exact-id lookup that answers `null` for anything
 * that is not one of this collection's ids. Both are merged into the one page
 * shape the screen consumes, so nothing downstream knows there were two.
 */
export function getCollectionRecordsInfiniteQueryOptions(
	scope: CollectionRecordsScope,
) {
	const search = scope.search;

	return infiniteQueryOptions({
		queryKey: recordsQueryKey(scope),
		queryFn: async ({ pageParam }) => {
			// a query factory holds no hooks: read the session imperatively.
			const session = useAuthStore.getState().session;
			if (session === null) {
				throw new Error("Cannot load records without a session.");
			}

			// a search that can look in no field must match nothing. Payload reads
			// an `or` with no conditions as no filter at all, so sending one would
			// answer a search of a collection with no title-ish field with every
			// record it holds — the one wrong answer available here.
			const canSearchFields = search !== undefined && search.fields.length > 0;

			// the id lookup is speculative and exact, so it is worth one request on
			// the first page only: a later page would prepend the same record again,
			// and a query with a space in it is a phrase rather than an id.
			const idMatch =
				search !== undefined &&
				pageParam === 1 &&
				!/\s/.test(search.query) &&
				search.query.length > 0
					? await findRecordById(
							session.serverUrl,
							session.token,
							scope.slug,
							search.query,
						)
					: null;

			const page =
				search !== undefined && !canSearchFields
					? { docs: [], totalDocs: 0, hasNextPage: false, nextPage: null }
					: await fetchRecords(
							session.serverUrl,
							session.token,
							scope.slug,
							pageParam,
							search,
						);

			return toRecordPage(page, idMatch);
		},
		initialPageParam: 1,
		getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
	});
}
