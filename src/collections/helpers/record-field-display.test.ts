import { describe, expect, it } from "@jest/globals";
import type {
	RecordField,
	RecordFieldKind,
	RecordFieldReadOnlyReason,
} from "~/collections/helpers/record-fields";
import {
	describeBoolean,
	describeReadOnlyReason,
	formatReadOnlyValue,
	hasEditedText,
	parseEditedText,
	parseEditorText,
	toEditableText,
	toEditorText,
	toJsonText,
} from "./record-field-display";

function fieldOf(
	name: string,
	value: unknown,
	kind: RecordFieldKind,
	readOnlyReason: RecordFieldReadOnlyReason | null = null,
): RecordField {
	return {
		name,
		label: name,
		value,
		kind,
		isEditable: readOnlyReason === null,
		readOnlyReason,
	};
}

describe("describeReadOnlyReason()", () => {
	// each cause states what is true of the field, so the four stay
	// distinguishable rather than collapsing into one "read-only".
	it.each<[RecordFieldReadOnlyReason, string]>([
		["server-assigned", "Server-assigned"],
		["permission", "No permission"],
		["rich-text", "Not editable here yet"],
		["no-value", "No value"],
	])("states %s as %s", (reason, expected) => {
		expect(describeReadOnlyReason(reason)).toBe(expected);
	});
});

describe("formatReadOnlyValue()", () => {
	it("shows an em dash for a field holding no value", () => {
		expect(
			formatReadOnlyValue(fieldOf("archivedAt", null, "none", "no-value")),
		).toBe("—");
	});

	// the document is a Lexical tree this app cannot render, so the row names its
	// shape instead of filling itself with markup nobody asked for.
	it("names Rich Text rather than serializing the document", () => {
		const value = { root: { type: "root", children: [] } };

		expect(
			formatReadOnlyValue(fieldOf("content", value, "json", "rich-text")),
		).toBe("Rich Text");
	});

	it("reads the two server-maintained timestamps as dates", () => {
		expect(
			formatReadOnlyValue(
				fieldOf(
					"updatedAt",
					"2026-08-19T07:22:11.123Z",
					"text",
					"server-assigned",
				),
			),
		).toBe("19 Aug 2026");
		expect(
			formatReadOnlyValue(
				fieldOf(
					"createdAt",
					"2026-08-12T07:22:11.123Z",
					"text",
					"server-assigned",
				),
			),
		).toBe("12 Aug 2026");
	});

	// an id is opaque, and some ids parse as dates. it is shown as it is.
	it("leaves an id alone, even one a date parser would accept", () => {
		expect(
			formatReadOnlyValue(fieldOf("id", "2026", "text", "server-assigned")),
		).toBe("2026");
	});

	it("leaves a timestamp field that is not a date alone", () => {
		expect(
			formatReadOnlyValue(
				fieldOf("updatedAt", "never", "text", "server-assigned"),
			),
		).toBe("never");
	});

	it("shows an ordinary value as it is, and a structure as its JSON", () => {
		expect(
			formatReadOnlyValue(
				fieldOf("internalNote", "Draft copy", "text", "permission"),
			),
		).toBe("Draft copy");
		expect(
			formatReadOnlyValue(fieldOf("views", 7, "number", "permission")),
		).toBe("7");
		expect(
			formatReadOnlyValue(fieldOf("tags", ["release"], "json", "permission")),
		).toBe('[\n  "release"\n]');
	});
});

describe("toEditableText()", () => {
	it("opens a text input with the string itself", () => {
		expect(toEditableText(fieldOf("title", "Shipping v2", "text"))).toBe(
			"Shipping v2",
		);
	});

	it("opens a numeric input with the number's digits", () => {
		expect(toEditableText(fieldOf("readingMinutes", 7, "number"))).toBe("7");
	});

	// pretty-printed rather than dumped on one line: the editor is where the
	// structure has to be readable and re-editable.
	it("opens a raw-JSON editor with the value serialized and indented", () => {
		expect(
			toEditableText(fieldOf("seo", { title: "A", noIndex: false }, "json")),
		).toBe('{\n  "title": "A",\n  "noIndex": false\n}');
	});
});

describe("toJsonText()", () => {
	it("indents by two spaces", () => {
		expect(toJsonText(["a", "b"])).toBe('[\n  "a",\n  "b"\n]');
	});

	// `JSON.stringify` answers `undefined` rather than a string for a value it
	// cannot represent, which would put the literal "undefined" in an editor.
	it("answers an empty string for a value JSON cannot represent", () => {
		expect(toJsonText(undefined)).toBe("");
	});
});

describe("describeBoolean()", () => {
	it("reads a switch's two positions", () => {
		expect(describeBoolean(true)).toBe("On");
		expect(describeBoolean(false)).toBe("Off");
	});
});

describe("parseEditedText()", () => {
	it("sends a text field's typed string as it is", () => {
		expect(parseEditedText(fieldOf("title", "A", "text"), "B")).toEqual({
			value: "B",
		});
	});

	it("clears a text field that was emptied", () => {
		expect(parseEditedText(fieldOf("title", "A", "text"), "")).toEqual({
			value: "",
		});
	});

	it("sends a numeric field's value as a number", () => {
		expect(parseEditedText(fieldOf("views", 3, "number"), "42")).toEqual({
			value: 42,
		});
		expect(parseEditedText(fieldOf("rating", 1, "number"), "-2.5")).toEqual({
			value: -2.5,
		});
	});

	// the server does not refuse a string sent to a number field — it returns 200
	// and stores `null` — so nothing downstream would catch this. it is not sent.
	it.each<[string]>([["seven"], [""], ["   "], ["1e999"]])(
		"sends nothing for the numeric text %p",
		(text) => {
			expect(parseEditedText(fieldOf("views", 3, "number"), text)).toBeNull();
		},
	);

	it("sends a raw-JSON field's text parsed", () => {
		expect(parseEditedText(fieldOf("tags", [], "json"), '["release"]')).toEqual(
			{ value: ["release"] },
		);
	});

	it("sends nothing for raw JSON that does not parse", () => {
		expect(parseEditedText(fieldOf("tags", [], "json"), "[release")).toBeNull();
	});
});

describe("hasEditedText()", () => {
	it("is false for a blur that changed nothing", () => {
		expect(hasEditedText(fieldOf("title", "A", "text"), "A")).toBe(false);
		expect(hasEditedText(fieldOf("views", 3, "number"), "3")).toBe(false);
		expect(hasEditedText(fieldOf("tags", ["a"], "json"), '[\n  "a"\n]')).toBe(
			false,
		);
	});

	it("is true once the text differs from what was loaded", () => {
		expect(hasEditedText(fieldOf("title", "A", "text"), "B")).toBe(true);
		// re-indented JSON parses to the same object but is a different stored
		// string, so it is a change worth sending.
		expect(hasEditedText(fieldOf("tags", ["a"], "json"), '["a"]')).toBe(true);
	});
});

// the pair the field editor uses. they take the kind and the value rather than
// the field, because what a sheet opens on is not necessarily what the record
// holds — a change still queued, or one the server refused, is more recent.
describe("toEditorText()", () => {
	it.each<[string, RecordFieldKind, unknown, string]>([
		["a multi-line string as itself", "multiline-text", "One\nTwo", "One\nTwo"],
		["a single-line string as itself", "text", "Hello", "Hello"],
		["a number as its digits", "number", 7, "7"],
		["an object as pretty JSON", "json", { a: 1 }, '{\n  "a": 1\n}'],
		["an array as pretty JSON", "json", ["a"], '[\n  "a"\n]'],
		["a null as nothing at all", "multiline-text", null, ""],
	])("opens %s", (_, kind, value, expected) => {
		expect(toEditorText(kind, value)).toBe(expected);
	});
});

describe("parseEditorText()", () => {
	it("reads raw JSON back into its value", () => {
		expect(parseEditorText("json", '["a", "b"]')).toEqual({
			value: ["a", "b"],
		});
	});

	// the server answers 200 to a value of the wrong type and stores `null`, so
	// text that cannot be read back is held rather than sent and quietly lost.
	it("refuses raw JSON that does not parse", () => {
		expect(parseEditorText("json", "[release")).toBeNull();
	});

	it("takes a multi-line string exactly as typed, newlines and all", () => {
		expect(parseEditorText("multiline-text", "One\n\nThree")).toEqual({
			value: "One\n\nThree",
		});
	});

	// an emptied multi-line field is an ordinary edit that clears the value,
	// unlike an emptied numeric one, where there is no number to send.
	it("takes an emptied multi-line string as an edit, and an emptied number as nothing", () => {
		expect(parseEditorText("multiline-text", "")).toEqual({ value: "" });
		expect(parseEditorText("number", "")).toBeNull();
	});
});
