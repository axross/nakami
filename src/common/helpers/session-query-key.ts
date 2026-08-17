/** Stands in for the signed-in user's id wherever a described key is reported. */
const REDACTED_USER_ID = "*";

/** Stands in for a key segment whose value must not reach a report. */
const OPAQUE_SEGMENT = "?";

/**
 * The query-key root every cache entry belonging to one authentication session
 * hangs beneath. Rooting keys here is what lets the session's end evict all of
 * them in a single `removeQueries` call — a trailing filter object separates
 * entries just as well, but no prefix reaches them.
 *
 * The user id stands for the whole session, server included: the two are one
 * pair, and a `queryFn` reads the server URL from the session alongside the
 * token, so the URL identifies the request rather than the data.
 */
export function getSessionQueryKeyRoot(userId: string) {
	return ["users", userId] as const;
}

/**
 * Describes a query key as a slash-joined path, so a report of a failed query
 * names the resource that failed rather than the one segment every
 * session-scoped key happens to share. A collection list describes as `users`,
 * a redacted user id, then `collections`; a collection's records add the slug
 * and `records` after that.
 *
 * The redacted root is rebuilt through {@link getSessionQueryKeyRoot} rather
 * than written out here, so both its length and its literal prefix follow that
 * factory — the next change to the root's shape carries into the description
 * instead of silently flattening it again. A key counts as session-scoped only
 * when it is at least as long as that root and begins with the same first
 * segment; every other key keeps exactly the segments it had, so a key shorter
 * than the root can never gain a redacted segment it never carried.
 *
 * The signed-in user's id never reaches the description of a session-scoped
 * key, and a segment that is not a string is described as `?` rather than
 * serialized, so a key that one day carries a filter object cannot put its
 * values into a report either.
 */
export function describeQueryKey(queryKey: readonly unknown[]): string {
	const redactedRoot = getSessionQueryKeyRoot(REDACTED_USER_ID);
	const isSessionScoped =
		queryKey.length >= redactedRoot.length && queryKey[0] === redactedRoot[0];
	const segments: readonly unknown[] = isSessionScoped
		? [...redactedRoot, ...queryKey.slice(redactedRoot.length)]
		: queryKey;

	return segments
		.map((segment) => (typeof segment === "string" ? segment : OPAQUE_SEGMENT))
		.join("/");
}
