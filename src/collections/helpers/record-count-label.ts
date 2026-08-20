/**
 * what the record feed's count line is reporting: the whole collection's size,
 * how much of it a search matched, or that a search has not come back yet.
 *
 * a union rather than a number and a flag, so the state with no number at all
 * needs no stand-in value — `0` matching records is a real answer and would be
 * indistinguishable from one.
 */
export type RecordCount =
	| { readonly kind: "all"; readonly total: number }
	| { readonly kind: "matches"; readonly total: number }
	| { readonly kind: "searching" };

/**
 * what the record feed's count line reads, in each state it has.
 *
 * one function rather than a phrase built where it is drawn, because the
 * readings have to stay one voice: the same line reports the collection's own
 * size, how much of it a search matched, that a search matched none of it, and
 * that a search is still in flight. Written inline they would drift, and three
 * of the four only ever appear while someone is typing.
 */
export function describeRecordCount(count: RecordCount): string {
	if (count.kind === "searching") {
		return "Searching…";
	}

	const noun = count.total === 1 ? "record" : "records";

	if (count.kind === "matches") {
		return count.total === 0
			? "No matching records"
			: `${count.total} matching ${noun}`;
	}

	return `${count.total} ${noun}`;
}
