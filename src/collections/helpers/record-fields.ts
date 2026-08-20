import { humanizeSlug } from "~/collections/helpers/humanize-slug";
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
 */
export type RecordFieldKind = "text" | "number" | "boolean" | "json" | "none";

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
	/** the display label, humanized from {@link RecordField.name}. */
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
			return "text";
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
			label: humanizeSlug(name),
			value,
			kind: inferKind(value),
			isEditable: readOnlyReason === null,
			readOnlyReason,
		};
	});
}
