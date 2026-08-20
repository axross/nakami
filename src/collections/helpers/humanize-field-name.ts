// a camelCase boundary: a lowercase letter or digit followed by a capital
// (`readingMinutes` → `reading Minutes`).
const CAMEL_BOUNDARY = /([a-z0-9])([A-Z])/g;

// the end of a run of capitals, marked by the last capital of the run starting
// a new word (`HTMLContent` → `HTML Content`). without it the rule above leaves
// an acronym glued to the word after it.
const ACRONYM_BOUNDARY = /([A-Z]+)([A-Z][a-z])/g;

/**
 * turns a Payload field name into a display label. Payload publishes no admin
 * label over REST, so the name is the only source, and a field name is a
 * JavaScript identifier rather than a slug: it splits on `-`/`_` **and** on
 * camelCase boundaries, then title-cases each word (`"readingMinutes"` →
 * `"Reading Minutes"`, `"created_at"` → `"Created At"`, `"id"` → `"Id"`).
 *
 * a run of capitals stays together, because title-casing only ever touches a
 * word's first character: `"seoURL"` → `"Seo URL"` rather than `"Seo Url"`. a
 * name with no word characters falls back to itself.
 *
 * this is deliberately **not**
 * {@link import("~/collections/helpers/humanize-slug").humanizeSlug}, which
 * serves collection slugs. Payload guarantees those lowercase and hyphenated,
 * so widening that helper with a camelCase rule could only change the
 * collection list's own labels, for a gain it does not need.
 */
export function humanizeFieldName(fieldName: string): string {
	const words = fieldName
		.replace(ACRONYM_BOUNDARY, "$1 $2")
		.replace(CAMEL_BOUNDARY, "$1 $2")
		.split(/[-_\s]+/)
		.filter((word) => word.length > 0)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1));

	return words.length > 0 ? words.join(" ") : fieldName;
}
