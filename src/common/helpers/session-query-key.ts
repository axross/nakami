/**
 * the query-key root every cache entry belonging to one authentication session
 * hangs beneath. rooting keys here is what lets the session's end evict all of
 * them in a single `removeQueries` call — a trailing filter object separates
 * entries just as well, but no prefix reaches them.
 *
 * the user id stands for the whole session, server included: the two are one
 * pair, and a `queryFn` reads the server URL from the session alongside the
 * token, so the URL identifies the request rather than the data.
 */
export function getSessionQueryKeyRoot(userId: string) {
	return ["users", userId] as const;
}
