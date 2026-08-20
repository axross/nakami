import {
	formatRecordDate,
	parseUpdatedAt,
} from "~/collections/helpers/format-updated-at";
import type {
	RecordField,
	RecordFieldKind,
	RecordFieldReadOnlyReason,
} from "~/collections/helpers/record-fields";

/**
 * how many spaces a raw-JSON editor indents by. the value is pretty-printed
 * rather than dumped on one line, because the editor is where the structure has
 * to be readable and re-editable — a 200-character single line is neither.
 */
const JSON_INDENT = 2;

/** what a read-only row shows in place of a value it does not have. */
const NO_VALUE_DISPLAY = "—";

/**
 * what a read-only Rich Text row shows in place of its content. the document is
 * a Lexical tree this app cannot render, so its shape is named rather than
 * serialized — dumping the JSON would fill the row with markup the reader did
 * not ask for and could not edit.
 */
const RICH_TEXT_DISPLAY = "Rich Text";

/**
 * the timestamps Payload maintains, which read as dates rather than as the
 * ISO-8601 strings the server sends. `id` is deliberately not among them: it is
 * an opaque identifier, and some of them parse as dates.
 */
const DATE_FIELDS: readonly string[] = ["createdAt", "updatedAt"];

/**
 * the sentence a read-only row states instead of showing an inert control, one
 * per cause, so the four stay distinguishable rather than collapsing into
 * "read-only". each is written as what is true of the field rather than as an
 * apology, and `rich-text` says "yet" because Rich Text editing is a follow-up
 * rather than a decision against it.
 */
const READ_ONLY_REASONS: Record<RecordFieldReadOnlyReason, string> = {
	"server-assigned": "Server-assigned",
	permission: "No permission",
	"rich-text": "Not editable here yet",
	"no-value": "No value",
};

/** the short sentence stating why a field cannot be edited. */
export function describeReadOnlyReason(
	reason: RecordFieldReadOnlyReason,
): string {
	return READ_ONLY_REASONS[reason];
}

/**
 * what a read-only row shows where the control would be.
 *
 * a value with no useful rendering is named rather than printed: a `null` field
 * shows an em dash and a Rich Text field shows what it is. `createdAt` and
 * `updatedAt` are the two fields whose string is a timestamp rather than
 * content, and they read as dates. everything else is shown as it is, with an
 * array or object serialized the way its editor would have.
 */
export function formatReadOnlyValue(field: RecordField): string {
	if (field.value === null || field.value === undefined) {
		return NO_VALUE_DISPLAY;
	}

	if (field.readOnlyReason === "rich-text") {
		return RICH_TEXT_DISPLAY;
	}

	if (DATE_FIELDS.includes(field.name)) {
		const parsed = parseUpdatedAt(field.value);

		if (parsed !== null) {
			return formatRecordDate(parsed);
		}
	}

	return typeof field.value === "object"
		? toJsonText(field.value)
		: String(field.value);
}

/** an array or object as the raw-JSON editor's text, pretty-printed. */
export function toJsonText(value: unknown): string {
	return JSON.stringify(value, null, JSON_INDENT) ?? "";
}

/**
 * the text an editor opens with, for a value that is not necessarily the one
 * the record carries. the dialog editor seeds from a value that may be still
 * queued or already refused, and the row's preview shows that same value, so
 * both take the kind and the value rather than the field.
 */
export function toEditorText(kind: RecordFieldKind, value: unknown): string {
	if (kind === "json") {
		return toJsonText(value);
	}

	return value === null || value === undefined ? "" : String(value);
}

/**
 * the text an editable field's input opens with. it is the value as the user
 * will edit it — a number as its digits, an array or object as the JSON its
 * editor round-trips — so what is typed and what was loaded are the same kind
 * of thing and can be compared as strings.
 *
 * a boolean has no text form here: its control is a switch, which carries the
 * value itself.
 */
export function toEditableText(field: RecordField): string {
	return toEditorText(field.kind, field.value);
}

/**
 * what a field's preview announces to assistive technology.
 *
 * for everything but raw JSON that is the text itself. for raw JSON it is a
 * summary — "Object with 2 keys" — rather than the serialized value, because a
 * screen reader given `{"title": "A", "noIndex": false}` reads out every brace
 * and quotation mark, which is worse than useless on a control whose whole job
 * is to be tapped. what the value actually is stays on screen for a sighted
 * reader, and the editor the control opens announces the text in full.
 */
export function describePreviewValue(
	kind: RecordFieldKind,
	value: unknown,
): string {
	if (kind !== "json") {
		return toEditorText(kind, value);
	}

	if (Array.isArray(value)) {
		return value.length === 0
			? "Empty list"
			: `List of ${countOf(value.length, "item")}`;
	}

	if (typeof value === "object" && value !== null) {
		const keys = Object.keys(value).length;

		return keys === 0 ? "Empty object" : `Object with ${countOf(keys, "key")}`;
	}

	// a `json` kind is an array or an object by construction, so nothing should
	// reach here. the text is the honest fallback rather than a thrown error: a
	// wrong announcement is a defect, and a crashed row is a worse one.
	return toEditorText(kind, value);
}

/** `1 key` and `2 keys`, so a summary never reads as `1 keys`. */
function countOf(count: number, noun: string): string {
	return `${count} ${noun}${count === 1 ? "" : "s"}`;
}

/** what a boolean row shows beside its switch. */
export function describeBoolean(value: unknown): string {
	return value === true ? "On" : "Off";
}

/**
 * the outcome of reading what was typed back into a value to save. `null` means
 * there is nothing to send — the text does not parse, which for the raw-JSON
 * editor is the rule the change was specified with, and for a numeric one is
 * the same rule for the same reason.
 *
 * this app cannot rely on the server to reject a bad value: measured against a
 * real Payload 3.88.0 server, a string sent to a number field returns 200 and
 * stores `null`. So text that does not parse is not sent, rather than sent and
 * silently turned into an erased field. An emptied numeric input is the same
 * case — there is no number in it to send — while an emptied text input is an
 * ordinary edit that clears the field.
 */
export function parseEditorText(
	kind: RecordFieldKind,
	text: string,
): { readonly value: unknown } | null {
	if (kind === "json") {
		try {
			return { value: JSON.parse(text) as unknown };
		} catch {
			return null;
		}
	}

	if (kind === "number") {
		const value = Number(text);

		return text.trim().length > 0 && Number.isFinite(value) ? { value } : null;
	}

	return { value: text };
}

/** {@link parseEditorText} for a field whose own value is what was edited. */
export function parseEditedText(
	field: RecordField,
	text: string,
): { readonly value: unknown } | null {
	return parseEditorText(field.kind, text);
}

/**
 * whether what is in the input differs from what the field currently holds, so
 * a character typed and undone sends nothing. the comparison is on the text
 * rather than on the parsed value, because the text is what the user actually
 * edited — re-indented JSON that parses to the same object is a change to the
 * stored string and is worth sending.
 *
 * this is the *second* of the two guards a save passes, and cannot be the only
 * one: `field.value` moves with the record's query while the input holds what
 * it was seeded with, so an untouched input can differ from it without anyone
 * having edited anything. the row asks whether the user typed at all first —
 * see `CollectionRecordFieldRow`.
 */
export function hasEditedText(field: RecordField, text: string): boolean {
	return text !== toEditableText(field);
}
