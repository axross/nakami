import { queryOptions } from "@tanstack/react-query";
import { toCollectionList } from "~/collections/models/collection";
import {
	type CollectionAccessScope,
	getCollectionAccessQueryOptions,
} from "~/collections/queries/collection-access-query";

/**
 * the session a collection list is scoped to — its cache identity. the user id
 * stands for the whole session, so switching account or server refetches
 * instead of showing another session's collections.
 */
export type CollectionListScope = CollectionAccessScope;

/**
 * query options for the signed-in server's readable, non-system collections.
 * consume with `useQuery(getCollectionListQueryOptions(scope))`, gating on an
 * active session at the call site (`enabled`).
 *
 * the list is a **view** of the access map rather than a query of its own: the
 * key, the fetch, and the cache entry are
 * {@link getCollectionAccessQueryOptions}'s, and only the mapping is added
 * here. that is what keeps this screen and the record detail screen — which
 * needs the same response whole, for its per-field entries — on one request and
 * one cached copy, with no second key that could answer differently.
 */
export function getCollectionListQueryOptions(scope: CollectionListScope) {
	return queryOptions({
		...getCollectionAccessQueryOptions(scope),
		select: toCollectionList,
	});
}
