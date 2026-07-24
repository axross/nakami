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

/** A record's derived display title and whether it came from a real field. */
export interface DerivedRecordTitle {
	/** The title to show — a title-ish field's value, or the record id. */
	readonly title: string;
	/** `false` when no title-ish field existed and the title fell back to the id. */
	readonly hasTitle: boolean;
}

/**
 * Derives a record's display title from its fields. Returns the first present,
 * non-empty **string** field among {@link TITLE_FIELDS} (in priority order);
 * when none exists, falls back to the record's id with `hasTitle: false` so the
 * UI can style the fallback distinctly. Non-string fields (numbers, objects,
 * relationships) are skipped rather than coerced.
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

const MONTHS = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
] as const;

/**
 * Formats a record's `updatedAt` into a short "Updated 18 Jul 2026" label, or
 * `null` when the value is absent or not a valid date string. Formatted in UTC
 * so the label is deterministic (no device-timezone or `Intl` dependence),
 * matching the secondary line the record card shows under the title.
 */
export function formatUpdatedLabel(updatedAt: unknown): string | null {
	if (typeof updatedAt !== "string") {
		return null;
	}

	const date = new Date(updatedAt);
	if (Number.isNaN(date.getTime())) {
		return null;
	}

	return `Updated ${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}
