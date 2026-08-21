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
		isQueued?: boolean;
		refusalMessage?: string | null;
	} = {},
) {
	const onSave = jest.fn<(fieldName: string, value: unknown) => void>();
	const row = (subject: RecordField) => (
		<CollectionRecordFieldRow
			field={subject}
			isQueued={overrides.isQueued ?? false}
			onSave={onSave}
			refusalMessage={overrides.refusalMessage ?? null}
		/>
	);
	const view = render(row(field));

	return Object.assign(view, {
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
			expect(input.props.multiline).toBe(false);
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

		it("gives an array or object a multi-line editor holding its JSON", () => {
			const { getByTestId } = renderRow(
				fieldOf("seo", { title: "A", noIndex: false }, "json"),
			);
			const input = getByTestId("record-field-seo-input");

			expect(input.props.value).toBe(
				'{\n  "title": "A",\n  "noIndex": false\n}',
			);
			expect(input.props.multiline).toBe(true);
		});
	});

	describe("the four read-only reasons", () => {
		it.each<[RecordFieldReadOnlyReason, unknown]>([
			["server-assigned", "a1"],
			["permission", "Draft copy"],
			["rich-text", { root: { type: "root", children: [] } }],
			["no-value", null],
		])("marks %s rather than showing a control", (reason, value) => {
			const kind: RecordFieldKind = reason === "no-value" ? "none" : "text";
			const { getByTestId, queryByTestId } = renderRow(
				fieldOf("field", value, kind, reason),
			);

			expect(getByTestId("record-field-field-value-reason")).toBeTruthy();
			expect(queryByTestId("record-field-field-input")).toBeNull();
		});

		// the reason is a mark now, so the row must not also be spending a third of
		// its width saying the same thing in words — and tapping the mark has to be
		// the way that sentence is reachable.
		it.each<[RecordFieldReadOnlyReason, unknown, string]>([
			[
				"server-assigned",
				"a1",
				"Payload maintains this field itself, so it can't be edited here.",
			],
			[
				"permission",
				"Draft copy",
				"Your account doesn't have permission to update this field.",
			],
			[
				"rich-text",
				{ root: { type: "root", children: [] } },
				"This app can't edit a Rich Text field yet, so it's left as it is.",
			],
			[
				"no-value",
				null,
				"This field is empty, and there's no way to tell which kind of value it takes.",
			],
		])("keeps %s's sentence behind its mark", (reason, value, sentence) => {
			const kind: RecordFieldKind = reason === "no-value" ? "none" : "text";
			const { getByTestId, getByText, queryByText } = renderRow(
				fieldOf("field", value, kind, reason),
			);

			expect(queryByText(sentence)).toBeNull();

			fireEvent.press(getByTestId("record-field-field-value-reason"));

			expect(getByText(sentence)).toBeTruthy();
		});

		// the pair used to be one accessible element on the surface; a button
		// cannot live inside one, so the value carries the same announcement.
		it("announces the value and its reason together", () => {
			const { getByText } = renderRow(
				fieldOf("archivedAt", null, "none", "no-value"),
			);

			expect(getByText("—").props.accessibilityLabel).toBe(
				"Archived At: —. This field is empty, and there's no way to tell which kind of value it takes.",
			);
		});

		it("draws no reason mark on a row that can be edited", () => {
			const { queryByTestId } = renderRow(fieldOf("title", "Shipping", "text"));

			expect(queryByTestId("record-field-title-value-reason")).toBeNull();
		});

		// neither half of this pair is observable from what a render produces, and
		// each is wrong on its own: the surface aligns to the start so the mark
		// holds the top corner of a value that wraps, and the value opts back out
		// so a single line still sits where an editable input's single line does.
		it("holds the mark at the top while the value keeps the centre line", () => {
			const { getByTestId, getByText } = renderRow(
				fieldOf("id", "a1", "text", "server-assigned"),
			);

			expect(
				resolveStyle(getByTestId("record-field-id-value").props.style),
			).toMatchObject({ alignItems: "flex-start" });
			expect(resolveStyle(getByText("a1").props.style)).toMatchObject({
				alignSelf: "center",
			});
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

		it("sends raw JSON parsed", () => {
			const { getByTestId, onSave } = renderRow(
				fieldOf("tags", ["release"], "json"),
			);
			const input = getByTestId("record-field-tags-input");

			fireEvent.changeText(input, '["release", "shipping"]');
			fireEvent(input, "blur");

			expect(onSave).toHaveBeenCalledWith("tags", ["release", "shipping"]);
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
		it.each<[string, RecordFieldKind, unknown, string]>([
			["a number that will not parse", "number", 7, "seven"],
			["raw JSON that will not parse", "json", ["a"], "[release"],
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
					field={field}
					isQueued={false}
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
