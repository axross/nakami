import { fetchRecord } from "~/collections/helpers/fetch-record";
import type { RecordDocument } from "~/collections/models/record";

/**
 * looks a record up by the exact id a reader typed, and answers `null` rather
 * than failing when there is no such record.
 *
 * a record's id is the only handle a title-less record has — every card shows
 * one in its pill — but an id is not a text field a `where` clause can match.
 * Its type belongs to the database adapter (a Mongo `ObjectID`, a Postgres
 * integer, a UUID), so a string of the wrong shape put into a query is refused
 * or miscast rather than simply unmatched, and it would take the whole search
 * down with it. `findByID` takes whatever id type the server uses and answers
 * 404 when it does not recognize one, which is why the lookup goes there
 * instead.
 *
 * **every** failure resolves to `null`: a 404, a token the server turned away,
 * an id it would not cast, a host it could not reach, a body that did not
 * parse. This lookup runs beside a search that has its own error surface, and
 * it is speculative — the reader typed text, not necessarily an id — so a
 * failure here is the answer "not an id", never a failure of the search. Its
 * silence is the reason it stays this narrow: nothing else in this feature
 * swallows an error, and widening what this is used for would swallow one that
 * mattered.
 */
export async function findRecordById(
	serverUrl: string,
	token: string,
	slug: string,
	recordId: string,
): Promise<RecordDocument | null> {
	try {
		return await fetchRecord(serverUrl, token, slug, recordId);
	} catch {
		return null;
	}
}
