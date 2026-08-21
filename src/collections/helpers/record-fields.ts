import { humanizeFieldName } from "~/collections/helpers/humanize-field-name";
import {
	type AccessResponse,
	canUpdateField,
} from "~/collections/models/collection";
import type { RecordDocument } from "~/collections/models/record";

/** the field Payload keys a record by, pinned to the top of the field list. */
const ID_FIELD = "id";

/**
 * the fields Payload maintains itself. they are shown like any other field and
 * are never editable, whatever the access response grants — a write to one is
 * refused by the server, and offering an input for it would only invite that
 * refusal.
 */
const SERVER_ASSIGNED_FIELDS: readonly string[] = [
	ID_FIELD,
	"createdAt",
	"updatedAt",
];

/**
 * what a field's value is, inferred from its JavaScript type, which decides
 * which control edits it. Payload publishes no field-type map over REST, so the
 * value is the only evidence there is: `"json"` covers an array or an object,
 * edited as raw JSON, and `"none"` is a field holding `null`, where nothing
 * distinguishes an empty number field from an empty Rich Text one.
 *
 * `"multiline-text"` is a string that carries a newline. Payload's `textarea`
 * and `text` are the same `string` over the wire — the REST response, the
 * GraphQL schema, and an introspection that is off in production by default all
 * say so — so the value is the only evidence of which one the collection
 * configured, and a newline in it is the whole of that evidence. Two
 * consequences are accepted rather than worked around: a long single-line
 * description stays a one-line field, and a multi-line value whose newlines are
 * all removed becomes one once the save lands.
 */
export type RecordFieldKind =
	| "text"
	| "multiline-text"
	| "number"
	| "boolean"
	| "json"
	| "none";

/**
 * the kinds a row edits in place, on the record screen itself. the others are
 * edited in a screen of their own — see {@link editsInDialog} — which is what
 * this type keeps the inline control's prop honest about.
 */
export type InlineFieldKind = "text" | "number";

/** the kinds edited in the field-editor dialog rather than in the row. */
export type DialogFieldKind = "multiline-text" | "json";

/**
 * whether a field of this kind is edited in the field-editor dialog rather than
 * in the row. the two kinds that are — a newline-carrying string and raw JSON —
 * are the two whose value does not fit a line, so the row previews the value and
 * the editing happens where there is room for it.
 *
 * a type predicate rather than a plain boolean, so a row that has already ruled
 * out the read-only, `none`, and `boolean` cases is left holding an
 * {@link InlineFieldKind} by the compiler rather than by a cast — which is what
 * makes adding a seventh kind a type error at every branch that has to decide
 * about it.
 */
export function editsInDialog(kind: RecordFieldKind): kind is DialogFieldKind {
	return kind === "multiline-text" || kind === "json";
}

/** a field the dialog editor can open: editable, and of a kind edited there. */
export interface DialogEditableField extends RecordField {
	readonly kind: DialogFieldKind;
}

/**
 * whether the dialog editor can open this field at all — which is both halves of
 * the question, not just the kind. a read-only field of a dialog kind still has
 * no editor, and the route that names one is a link rather than something a row
 * can produce.
 */
export function isDialogEditable(
	field: RecordField,
): field is DialogEditableField {
	return field.isEditable && editsInDialog(field.kind);
}

/**
 * why a field cannot be edited. the UI states which one applies rather than
 * showing an inert control, so each cause stays distinguishable instead of
 * collapsing into one "read-only".
 */
export type RecordFieldReadOnlyReason =
	| "server-assigned"
	| "permission"
	| "rich-text"
	| "no-value";

/** one row of a record detail screen: a field, its value, and what may be done to it. */
export interface RecordField {
	/** the Payload field name, shown as-is beside the label. */
	readonly name: string;
	/**
	 * the display label, humanized from {@link RecordField.name} — split on
	 * word separators and camelCase boundaries alike, since a field name is an
	 * identifier rather than a slug.
	 */
	readonly label: string;
	/** the value the record carries, unconverted. */
	readonly value: unknown;
	readonly kind: RecordFieldKind;
	readonly isEditable: boolean;
	/** the cause of `isEditable: false`, and `null` while the field is editable. */
	readonly readOnlyReason: RecordFieldReadOnlyReason | null;
}

/** the record to describe, and the access map deciding what may be saved in it. */
export interface RecordFieldsInput {
	readonly slug: string;
	readonly record: RecordDocument;
	readonly access: AccessResponse;
}

/**
 * whether a value is a Payload 3 Lexical document, recognized by its own
 * structure since nothing in the response labels it. the test is deliberately
 * narrow — a `root` object whose `type` is `"root"` and whose `children` is an
 * array — because anything looser locks an ordinary object out of editing, and
 * a Rich Text field mistaken for one would be offered a JSON editor that
 * overwrites it.
 */
function isRichText(value: unknown): boolean {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		return false;
	}

	const { root } = value as { root?: unknown };

	if (typeof root !== "object" || root === null) {
		return false;
	}

	const { type, children } = root as { type?: unknown; children?: unknown };

	return type === "root" && Array.isArray(children);
}

function inferKind(value: unknown): RecordFieldKind {
	if (value === null) {
		return "none";
	}

	switch (typeof value) {
		case "string":
			// the one inference the value carries about a Payload field type. see
			// `RecordFieldKind` for why a newline is the whole of the evidence.
			return value.includes("\n") ? "multiline-text" : "text";
		case "number":
			return "number";
		case "boolean":
			return "boolean";
		default:
			return "json";
	}
}

/**
 * the causes are checked most-permanent first. a field Payload assigns itself
 * stays server-assigned even where the account holds no update permission at
 * all, which keeps `id` reading as what it is rather than as a permission
 * problem the account could conceivably have fixed.
 */
function findReadOnlyReason(
	name: string,
	value: unknown,
	isUpdatable: boolean,
): RecordFieldReadOnlyReason | null {
	if (SERVER_ASSIGNED_FIELDS.includes(name)) {
		return "server-assigned";
	}

	if (!isUpdatable) {
		return "permission";
	}

	if (isRichText(value)) {
		return "rich-text";
	}

	if (value === null) {
		return "no-value";
	}

	return null;
}

/**
 * maps one record into the ordered field list its detail screen renders, so no
 * component holds any of the inference above.
 *
 * the order is the record's own key order — the order Payload serialized the
 * document in, which follows its collection config — with `id` pinned first, so
 * the screen reads as the collection was defined rather than alphabetically.
 */
export function toRecordFields({
	slug,
	record,
	access,
}: RecordFieldsInput): RecordField[] {
	const entries = Object.entries(record);
	const ordered = [
		...entries.filter(([name]) => name === ID_FIELD),
		...entries.filter(([name]) => name !== ID_FIELD),
	];

	return ordered.map(([name, value]) => {
		const readOnlyReason = findReadOnlyReason(
			name,
			value,
			canUpdateField(access, slug, name),
		);

		return {
			name,
			label: humanizeFieldName(name),
			value,
			kind: inferKind(value),
			isEditable: readOnlyReason === null,
			readOnlyReason,
		};
	});
}
