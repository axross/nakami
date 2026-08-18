// Payload's REST API exposes no per-record title or `useAsTitle` hint (the same
// gap the collection list hit for labels), so a record's display title is
// derived from its own fields: the first present, non-empty string field among
// these common title-ish names, in priority order.
const TITLE_FIELDS = [
	"title",
	"name",
	"label",
	"subject",
	"heading",
	"slug",
	"filename",
	"email",
] as const;

/** a record's derived display title and whether it came from a real field. */
export interface DerivedRecordTitle {
	/** a title-ish field's value, or the record id when none existed. */
	readonly title: string;
	/** `false` when no title-ish field existed and the title fell back to the id. */
	readonly hasTitle: boolean;
}

/**
 * derives a record's display title from its fields. returns the first present,
 * non-empty **string** field among {@link TITLE_FIELDS} (in priority order);
 * when none exists, falls back to the record's id with `hasTitle: false`, which
 * is what the UI branches on to show placeholder copy instead. non-string
 * fields (numbers, objects, relationships) are skipped rather than coerced.
 */
export function deriveRecordTitle(
	record: Record<string, unknown>,
): DerivedRecordTitle {
	for (const field of TITLE_FIELDS) {
		const value = record[field];
		if (typeof value === "string" && value.trim().length > 0) {
			return { title: value.trim(), hasTitle: true };
		}
	}

	return { title: String(record.id), hasTitle: false };
}
