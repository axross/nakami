import { fetchRecord } from "~/collections/helpers/fetch-record";
import type { RecordDocument } from "~/collections/models/record";
import { PayloadRequestError } from "~/common/helpers/payload-client";
import { createModuleLogger } from "~/core/helpers/logging";

const logger = createModuleLogger("collections/find-record-by-id");

/**
 * looks a record up by the exact id a reader typed, and answers `null` rather
 * than failing when the server does not recognize it as one of its ids.
 *
 * a record's id is the only handle a title-less record has — every card shows
 * one in its pill — but an id is not a text field a `where` clause can match.
 * Its type belongs to the database adapter (a Mongo `ObjectID`, a Postgres
 * integer, a UUID), so a string of the wrong shape put into a query is refused
 * or miscast rather than simply unmatched, and it would take the whole search
 * down with it. `findByID` takes whatever id type the server uses, which is why
 * the lookup goes there instead.
 *
 * **which failures mean "not an id" is decided by kind, not by status.** A
 * `"server"` failure is the answer that this string is not one of this
 * collection's ids: Payload reports that as a 404 on some database adapters and
 * as a cast failure — a 5xx — on others, so the status cannot be the test and
 * both are read as no match. A `"network"` or `"auth"` failure says nothing
 * about the string at all, so both propagate and let the search fail the way
 * its sibling field query would.
 *
 * that leaves one class swallowed: a genuine server fault on this endpoint,
 * indistinguishable from a refused cast without knowing the adapter. It is a
 * deliberate deviation from the rule against swallowing in a nested helper, and
 * it is recorded with its cost in
 * [agent-skills.md](../../../docs/conventions/agent-skills.md). A debug log is
 * what keeps it from being silent to a developer reading a session's log.
 */
export async function findRecordById(
	serverUrl: string,
	token: string,
	slug: string,
	recordId: string,
): Promise<RecordDocument | null> {
	try {
		return await fetchRecord(serverUrl, token, slug, recordId);
	} catch (error) {
		if (!(error instanceof PayloadRequestError) || error.kind !== "server") {
			throw error;
		}

		logger.debug("No record matched the typed id.", {
			slug,
			status: error.status,
		});

		return null;
	}
}
