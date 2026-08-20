import { type QueryClient, queryOptions } from "@tanstack/react-query";
import { useAuthStore } from "~/auth/stores/auth-store";
import { fetchRecord } from "~/collections/helpers/fetch-record";
import type { RecordDocument } from "~/collections/models/record";
import { getSessionQueryKeyRoot } from "~/common/helpers/session-query-key";

/**
 * the session + collection + record a detail view is scoped to — its cache
 * identity. the user id stands for the whole session (see
 * {@link getSessionQueryKeyRoot}), the slug names which collection, and the
 * record id which document inside it.
 */
export interface CollectionRecordScope {
	readonly userId: string;
	readonly slug: string;
	readonly recordId: string;
}

/**
 * query options for one record. consume with
 * `useQuery(getCollectionRecordQueryOptions(scope))`, gating on an active
 * session at the call site (`enabled`). the key extends the records list's own
 * key with the record id, so it mirrors the REST path beneath the session root;
 * the server URL and token are read fresh inside the `queryFn` (neither is
 * cache identity), exactly like the list factories.
 *
 * the parsed document travels rather than a view model: the rows a screen draws
 * need the collection's access map as well, which is a query of its own, so
 * {@link import("~/collections/helpers/record-fields").toRecordFields} joins
 * the two outside the cache.
 */
export function getCollectionRecordQueryOptions(scope: CollectionRecordScope) {
	return queryOptions({
		queryKey: [
			...getSessionQueryKeyRoot(scope.userId),
			"collections",
			scope.slug,
			"records",
			scope.recordId,
		],
		queryFn: async () => {
			// a query factory holds no hooks: read the session imperatively.
			const session = useAuthStore.getState().session;
			if (session === null) {
				throw new Error("Cannot load a record without a session.");
			}

			return await fetchRecord(
				session.serverUrl,
				session.token,
				scope.slug,
				scope.recordId,
			);
		},
	});
}

/**
 * writes one saved field's value into the cached record, so the screen's other
 * inputs go on showing what the server now holds without anything being
 * re-read.
 *
 * a patch rather than an invalidation, and deliberately so: a refetch would
 * replace the values sitting in every *other* input on the screen while the
 * user is still typing in them, which is the one thing a per-field save must
 * not do. only the field that was saved moves, and only in the entry keyed
 * above.
 *
 * the records **list** query is deliberately left alone. it has its own
 * staleness and focus-refetch rules, its entries are a different shape (a
 * derived view model, not the document), and a card showing a title one refetch
 * behind costs nothing — where a detail screen losing a half-typed field costs
 * the edit.
 *
 * a cache holding nothing for this record is left holding nothing: `undefined`
 * would otherwise be seeded into an entry no query has populated, and the
 * screen would render a record consisting of one field.
 */
export function setCachedRecordField(
	queryClient: QueryClient,
	scope: CollectionRecordScope,
	fieldName: string,
	value: unknown,
): void {
	const { queryKey } = getCollectionRecordQueryOptions(scope);

	queryClient.setQueryData<RecordDocument>(queryKey, (record) =>
		record === undefined ? undefined : { ...record, [fieldName]: value },
	);
}
