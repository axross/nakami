import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";
import { humanizeFieldName } from "~/collections/helpers/humanize-field-name";
import type {
	RecordField,
	RecordFieldKind,
	RecordFieldReadOnlyReason,
} from "~/collections/helpers/record-fields";
import { resolveStyle } from "~/common/test-helpers/resolve-style";
import { themes } from "~/unistyles";
import { styles } from "./collection-record-field-input";
import { CollectionRecordFieldRow } from "./collection-record-field-row";

function fieldOf(
	name: string,
	value: unknown,
	kind: RecordFieldKind,
	readOnlyReason: RecordFieldReadOnlyReason | null = null,
): RecordField {
	return {
		name,
		// the real derivation, so the label and the name are the two distinct
		// strings a row actually shows rather than one string twice.
		label: humanizeFieldName(name),
		value,
		kind,
		isEditable: readOnlyReason === null,
		readOnlyReason,
	};
}

/** the row under test, with a spy standing in for the pending-write queue. */
function renderRow(
	field: RecordField,
	overrides: {
		editedValue?: unknown;
		isQueued?: boolean;
		refusalMessage?: string | null;
	} = {},
) {
	const onSave = jest.fn<(fieldName: string, value: unknown) => void>();
	const onOpenEditor = jest.fn<(fieldName: string) => void>();
	const row = (subject: RecordField) => (
		<CollectionRecordFieldRow
			// the caller derives this from the queue; a row asked for nothing in
			// particular previews the record's own value, which is what the queue
			// resolves to when it holds nothing for the field.
			editedValue={
				"editedValue" in overrides ? overrides.editedValue : subject.value
			}
			field={subject}
			isQueued={overrides.isQueued ?? false}
			onOpenEditor={onOpenEditor}
			onSave={onSave}
			refusalMessage={overrides.refusalMessage ?? null}
		/>
	);
	const view = render(row(field));

	return Object.assign(view, {
		onOpenEditor,
		onSave,
		/** re-renders the same row against a field the record has since changed. */
		rerenderField(next: RecordField) {
			view.rerender(row(next));
		},
	});
}

describe("<CollectionRecordFieldRow>", () => {
	// the identifiers are the whole point of the row: a reader matching what is
	// on screen against a Payload config needs the name, and a reader reading the
	// screen needs the label.
	describe("the label line", () => {
		it("shows the label and the Payload field name together", () => {
			const { getByText } = renderRow(fieldOf("readingMinutes", 7, "number"));

			expect(getByText("Reading Minutes")).toBeTruthy();
			expect(getByText("readingMinutes")).toBeTruthy();
		});

		it("shows both on a read-only row too", () => {
			const { getByText } = renderRow(
				fieldOf("internalNote", "Draft copy", "text", "permission"),
			);

			expect(getByText("Internal Note")).toBeTruthy();
			expect(getByText("internalNote")).toBeTruthy();
		});

		// every text style here spreads a theme role rather than setting its own
		// metrics, and a spread that resolved to nothing would type-check exactly
		// the same while dropping the size, the family, and the line height.
		it("sets the field name in the monospace caption role", () => {
			const { getByText } = renderRow(fieldOf("title", "Hello", "text"));

			expect(resolveStyle(getByText("title").props.style)).toMatchObject({
				fontFamily: "JetBrainsMono-Regular",
				fontSize: 12,
				lineHeight: 18,
			});
		});

		it("sets the label in the caption role, at the emphatic ink", () => {
			const { getByText } = renderRow(fieldOf("title", "Hello", "text"));

			expect(resolveStyle(getByText("Title").props.style)).toMatchObject({
				fontFamily: "InnovatorGrotesk-Regular",
				fontSize: themes.light.typography.caption.fontSize,
				color: themes.light.colors.text.neutral.intense,
			});
		});

		// the two identifiers share an 18pt line box, which is the whole reason
		// `codeCaption` was added rather than a size inlined: it is what puts them
		// on one baseline.
		it("sets both identifiers on one shared line box", () => {
			const { getByText } = renderRow(fieldOf("title", "Hello", "text"));

			expect(resolveStyle(getByText("Title").props.style).lineHeight).toBe(
				resolveStyle(getByText("title").props.style).lineHeight,
			);
		});

		// the one thing the row promises about overflow: the name gives way and
		// the label does not, so the readable half is never the part that is
		// lost. a label with no room left wraps rather than being cut, and its
		// row grows with it.
		it("truncates the field name at its tail and never the label", () => {
			const field = fieldOf("aVeryLongFieldNameIndeed", "Hello", "text");
			const { getByText } = renderRow(field);
			const name = getByText("aVeryLongFieldNameIndeed");

			expect(name.props.numberOfLines).toBe(1);
			expect(resolveStyle(name.props.style).flexShrink).toBe(1);
			expect(resolveStyle(getByText(field.label).props.style).flexShrink).toBe(
				0,
			);
		});
	});

	describe("the control each kind gets", () => {
		it("gives a string field a text input holding the record's value", () => {
			const { getByTestId } = renderRow(
				fieldOf("title", "Shipping v2", "text"),
			);
			const input = getByTestId("record-field-title-input");

			expect(input.props.value).toBe("Shipping v2");
			expect(input.props.keyboardType).toBe("default");
			// the inline control is one line by construction now rather than by a
			// prop: everything it can hold fits on one, and everything that cannot
			// is edited in the sheet.
			expect(input.props.multiline).toBeFalsy();
		});

		it("gives a number field a numeric input holding its digits", () => {
			const { getByTestId } = renderRow(fieldOf("readingMinutes", 7, "number"));
			const input = getByTestId("record-field-readingMinutes-input");

			expect(input.props.value).toBe("7");
			expect(input.props.keyboardType).toBe("numeric");
		});

		it("gives a boolean field a switch at the record's position", () => {
			const { getByTestId, getByText } = renderRow(
				fieldOf("featured", true, "boolean"),
			);

			expect(getByTestId("record-field-featured-input").props.value).toBe(true);
			expect(getByText("On")).toBeTruthy();
		});

		it("gives an array or object a preview of its JSON, not an input", () => {
			const { getByTestId, queryByTestId } = renderRow(
				fieldOf("seo", { title: "A", noIndex: false }, "json"),
			);

			expect(getByTestId("record-field-seo-preview")).toBeTruthy();
			// the whole of the change: raw JSON is no longer typed into on this
			// screen, so there is no input here to type into.
			expect(queryByTestId("record-field-seo-input")).toBeNull();
		});

		it("gives a newline-carrying string the same preview", () => {
			const { getByTestId, queryByTestId } = renderRow(
				fieldOf("body", "First line\nSecond line", "multiline-text"),
			);

			expect(getByTestId("record-field-body-preview")).toBeTruthy();
			expect(queryByTestId("record-field-body-input")).toBeNull();
		});
	});

	// the preview is the affordance for the editor, and it is a button rather
	// than a text field in every sense a user could notice.
	describe("the preview", () => {
		it("shows three lines of the value and no more", () => {
			const { getByText } = renderRow(
				fieldOf("body", "One\nTwo\nThree\nFour", "multiline-text"),
			);

			expect(getByText("One\nTwo\nThree\nFour").props.numberOfLines).toBe(3);
		});

		it("shows the JSON its editor would open on", () => {
			const { getByText } = renderRow(
				fieldOf("seo", { title: "A", noIndex: false }, "json"),
			);

			expect(
				getByText('{\n  "title": "A",\n  "noIndex": false\n}'),
			).toBeTruthy();
		});

		// raw JSON is announced as a summary rather than read out brace by brace;
		// what is drawn is still the value itself, above.
		it("announces raw JSON as what it is rather than as its punctuation", () => {
			const { getByTestId } = renderRow(
				fieldOf("seo", { title: "A", noIndex: false }, "json"),
			);

			expect(
				getByTestId("record-field-seo-preview").props.accessibilityLabel,
			).toBe("Seo: Object with 2 keys");
		});

		it("names itself a button that opens an editor, not a text field", () => {
			const { getByTestId } = renderRow(
				fieldOf("body", "First\nSecond", "multiline-text"),
			);
			const preview = getByTestId("record-field-body-preview");

			expect(preview.props.accessibilityRole).toBe("button");
			expect(preview.props.accessibilityHint).toBe(
				"Opens an editor for this field.",
			);
			expect(preview.props.accessibilityLabel).toBe("Body: First\nSecond");
		});

		it("says so rather than showing an empty frame", () => {
			const { getByText } = renderRow(fieldOf("body", "", "multiline-text"));

			expect(getByText("Empty")).toBeTruthy();
		});

		it("asks the caller to open the editor when pressed", () => {
			const { getByTestId, onOpenEditor } = renderRow(
				fieldOf("body", "First\nSecond", "multiline-text"),
			);

			fireEvent.press(getByTestId("record-field-body-preview"));

			expect(onOpenEditor).toHaveBeenCalledWith("body");
		});

		// what the row seeds an inline input with and what the preview shows are
		// two different values, deliberately: the preview shows the queue's, so a
		// change the row cannot hold — because nothing here is being typed into —
		// survives this row unmounting.
		it("previews the caller's value rather than the record's", () => {
			const { getByText } = renderRow(
				fieldOf("body", "Saved\nvalue", "multiline-text"),
				{ editedValue: "Queued\nvalue" },
			);

			expect(getByText("Queued\nvalue")).toBeTruthy();
		});
	});

	describe("the four read-only reasons", () => {
		it.each<[RecordFieldReadOnlyReason, unknown, string]>([
			["server-assigned", "a1", "Server-assigned"],
			["permission", "Draft copy", "No permission"],
			[
				"rich-text",
				{ root: { type: "root", children: [] } },
				"Not editable here yet",
			],
			["no-value", null, "No value"],
		])("states %s rather than showing a control", (reason, value, stated) => {
			const kind: RecordFieldKind = reason === "no-value" ? "none" : "text";
			const { getByText, queryByTestId } = renderRow(
				fieldOf("field", value, kind, reason),
			);

			expect(getByText(stated)).toBeTruthy();
			expect(queryByTestId("record-field-field-input")).toBeNull();
		});

		it("shows a Rich Text field's shape rather than its markup", () => {
			const { getByText } = renderRow(
				fieldOf(
					"content",
					{ root: { type: "root", children: [{ type: "paragraph" }] } },
					"json",
					"rich-text",
				),
			);

			expect(getByText("Rich Text")).toBeTruthy();
		});

		it("shows an em dash where a field holding no value would have a control", () => {
			const { getByText } = renderRow(
				fieldOf("archivedAt", null, "none", "no-value"),
			);

			expect(getByText("—")).toBeTruthy();
		});
	});

	describe("saving", () => {
		it("sends the typed value on blur, naming only that field", () => {
			const { getByTestId, onSave } = renderRow(
				fieldOf("title", "Shipping v2", "text"),
			);
			const input = getByTestId("record-field-title-input");

			fireEvent.changeText(input, "Shipping v2 — revised");
			fireEvent(input, "blur");

			expect(onSave).toHaveBeenCalledTimes(1);
			expect(onSave).toHaveBeenCalledWith("title", "Shipping v2 — revised");
		});

		it("sends a number as a number rather than as its digits", () => {
			const { getByTestId, onSave } = renderRow(
				fieldOf("readingMinutes", 7, "number"),
			);
			const input = getByTestId("record-field-readingMinutes-input");

			fireEvent.changeText(input, "12");
			fireEvent(input, "blur");

			expect(onSave).toHaveBeenCalledWith("readingMinutes", 12);
		});

		it("sends nothing when the blur changed nothing", () => {
			const { getByTestId, onSave } = renderRow(
				fieldOf("title", "Shipping v2", "text"),
			);

			fireEvent(getByTestId("record-field-title-input"), "blur");

			expect(onSave).not.toHaveBeenCalled();
		});

		// the record moves under a screen that is left open — the query refetches
		// on focus and after 30s — while the row goes on showing what it seeded
		// with. a blur nobody typed into must not push that seeded text back over
		// whatever another account saved in the meantime; the server answers 200,
		// so nothing downstream would ever report the revert.
		it("sends nothing on an untouched blur after the record moved underneath", () => {
			const { getByTestId, onSave, rerenderField } = renderRow(
				fieldOf("title", "Written here", "text"),
			);

			rerenderField(fieldOf("title", "Written elsewhere", "text"));
			fireEvent(getByTestId("record-field-title-input"), "blur");

			expect(onSave).not.toHaveBeenCalled();
			// the seed still stands: the row deliberately does not re-seed itself,
			// so a half-typed field is never replaced by a background refetch.
			expect(getByTestId("record-field-title-input").props.value).toBe(
				"Written here",
			);
		});

		// the other half of the same guard: having typed is necessary, not
		// sufficient. a real edit still goes.
		it("sends an edit made after the record moved underneath", () => {
			const { getByTestId, onSave, rerenderField } = renderRow(
				fieldOf("title", "Written here", "text"),
			);

			rerenderField(fieldOf("title", "Written elsewhere", "text"));

			const input = getByTestId("record-field-title-input");
			fireEvent.changeText(input, "Written by hand");
			fireEvent(input, "blur");

			expect(onSave).toHaveBeenCalledWith("title", "Written by hand");
		});

		it("sends nothing on a second blur once the change has been sent", () => {
			const { getByTestId, onSave } = renderRow(
				fieldOf("title", "Shipping v2", "text"),
			);
			const input = getByTestId("record-field-title-input");

			fireEvent.changeText(input, "Shipping v3");
			fireEvent(input, "blur");
			fireEvent(input, "blur");

			expect(onSave).toHaveBeenCalledTimes(1);
		});

		// the server answers 200 and stores `null` for a value of the wrong type,
		// so nothing downstream could report the loss. it is not sent at all.
		// only the number case is a row's any more: raw JSON is typed into the
		// field editor now, and the same guard is asserted there against the same
		// helper.
		it.each<[string, RecordFieldKind, unknown, string]>([
			["a number that will not parse", "number", 7, "seven"],
		])("sends nothing for %s", (_, kind, value, typed) => {
			const { getByTestId, onSave } = renderRow(fieldOf("field", value, kind));
			const input = getByTestId("record-field-field-input");

			fireEvent.changeText(input, typed);
			fireEvent(input, "blur");

			expect(onSave).not.toHaveBeenCalled();
		});

		// a switch has no focus to lose: moving it is the whole edit.
		it("sends a switch's new position as soon as it is moved", () => {
			const { getByTestId, onSave } = renderRow(
				fieldOf("featured", true, "boolean"),
			);

			fireEvent(
				getByTestId("record-field-featured-input"),
				"valueChange",
				false,
			);

			expect(onSave).toHaveBeenCalledWith("featured", false);
		});

		it("leaves a moved switch where it was moved to while the change is queued", () => {
			const { getByTestId, getByText } = renderRow(
				fieldOf("featured", true, "boolean"),
			);
			const input = getByTestId("record-field-featured-input");

			fireEvent(input, "valueChange", false);

			expect(input.props.value).toBe(false);
			expect(getByText("Off")).toBeTruthy();
		});
	});

	describe("the row's state", () => {
		it("marks a change that has not reached the server", () => {
			const { getByText } = renderRow(fieldOf("title", "Hello", "text"), {
				isQueued: true,
			});

			expect(getByText("Not saved yet")).toBeTruthy();
		});

		it("shows nothing on the label line while there is nothing to say", () => {
			const { queryByText } = renderRow(fieldOf("title", "Hello", "text"));

			expect(queryByText("Not saved yet")).toBeNull();
			expect(queryByText("Refused")).toBeNull();
		});

		it("keeps the typed value and shows the server's own message on a refusal", () => {
			const field = fieldOf("readingMinutes", 7, "number");
			const { getByTestId, getByText, rerender, onSave } = renderRow(field);
			const input = getByTestId("record-field-readingMinutes-input");

			fireEvent.changeText(input, "12");
			fireEvent(input, "blur");
			expect(onSave).toHaveBeenCalled();

			rerender(
				<CollectionRecordFieldRow
					editedValue={field.value}
					field={field}
					isQueued={false}
					onOpenEditor={jest.fn()}
					onSave={onSave}
					refusalMessage="This field is required."
				/>,
			);

			// the value the user typed is still there to correct, not the record's.
			expect(getByTestId("record-field-readingMinutes-input").props.value).toBe(
				"12",
			);
			expect(getByText("This field is required.")).toBeTruthy();
			expect(getByText("Refused")).toBeTruthy();
		});

		// a refusal outranks a queued change on the one line the row has for it.
		it("marks a refusal rather than the queue when both are true", () => {
			const { getByText, queryByText } = renderRow(
				fieldOf("title", "Hello", "text"),
				{ isQueued: true, refusalMessage: "Nope." },
			);

			expect(getByText("Refused")).toBeTruthy();
			expect(queryByText("Not saved yet")).toBeNull();
		});

		// the refused ground and border are a Unistyles variant, and the jest mock
		// strips `variants` and stubs `useVariants` to a no-op — so the destructive
		// pair never reaches the rendered tree and cannot be asserted. what can
		// still fail is the selection, which is what these two cover.
		it("selects the refused treatment for the input", () => {
			const useVariants = jest.spyOn(styles, "useVariants");

			try {
				renderRow(fieldOf("title", "Hello", "text"), {
					refusalMessage: "Nope.",
				});

				expect(useVariants).toHaveBeenCalledWith({ refused: true });
			} finally {
				useVariants.mockRestore();
			}
		});

		it("selects the resting treatment while nothing was refused", () => {
			const useVariants = jest.spyOn(styles, "useVariants");

			try {
				renderRow(fieldOf("title", "Hello", "text"));

				expect(useVariants).toHaveBeenCalledWith({ refused: false });
			} finally {
				useVariants.mockRestore();
			}
		});
	});

	// no component may carry a size of its own: every size in this app is a role,
	// and a size with no role is a missing role.
	it("inlines no font size anywhere in the row", () => {
		const { getByText, getByTestId } = renderRow(
			fieldOf("title", "Hello", "text"),
			{ refusalMessage: "This field is required." },
		);

		for (const node of [
			getByText("Title"),
			getByText("title"),
			getByText("Refused"),
			getByText("This field is required."),
			getByTestId("record-field-title-input"),
		]) {
			const style = resolveStyle(node.props.style);
			// present, and from a role: every role in the theme pairs its size with
			// a family, so a hand-written size would arrive without one.
			expect(style.fontFamily).toEqual(expect.any(String));
			const roleSizes: readonly number[] = [
				themes.light.typography.caption.fontSize,
				themes.light.typography.codeCaption.fontSize,
				themes.light.typography.body.fontSize,
				themes.light.typography.code.fontSize,
			];
			expect(roleSizes).toContain(style.fontSize);
		}
	});
});
