import { TITLE_FIELDS } from "~/collections/helpers/derive-record-title";

/**
 * works out which of {@link TITLE_FIELDS} a collection can actually be searched
 * on, from records the server has already returned.
 *
 * this exists because Payload will not say. Its REST API reports no field
 * configuration, and asking it about a field a collection does not configure is
 * an *error* rather than an empty result — `QueryError`, at status 400 — so the
 * eight names cannot simply be `or`-ed together and left to miss. What the app
 * does have is the documents themselves: `recordSchema` keeps every field
 * rather than stripping to the four a card draws, so a loaded record's own keys
 * report which of those names that collection has.
 *
 * a name counts only where some record carries a **non-empty string** under it,
 * which is the same test `deriveRecordTitle` applies: a field holding a number,
 * an object, or a relationship id is not one `like` can match, and a field that
 * is `null` on every record loaded so far says nothing either way. The result
 * keeps {@link TITLE_FIELDS}' own order so a query's clauses are ordered the
 * same way on every collection, and never contains a name twice.
 *
 * the reading is a heuristic over one page rather than a fact about the
 * collection: a field absent from every record loaded so far is not searched,
 * even where the collection configures it. That is the direction to be wrong
 * in — a name left out costs matches, and a name wrongly included costs the
 * whole query.
 */
export function deriveSearchableFields(
	records: readonly Record<string, unknown>[],
): string[] {
	return TITLE_FIELDS.filter((field) =>
		records.some((record) => {
			const value = record[field];

			return typeof value === "string" && value.trim().length > 0;
		}),
	);
}
