import type { JSX } from "react";
import { useRef, useState } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { CollectionRecordFieldError } from "~/collections/components/collection-record-field-row/collection-record-field-error";
import { CollectionRecordFieldHead } from "~/collections/components/collection-record-field-row/collection-record-field-head";
import { CollectionRecordFieldInput } from "~/collections/components/collection-record-field-row/collection-record-field-input";
import { CollectionRecordFieldStatic } from "~/collections/components/collection-record-field-row/collection-record-field-static";
import { CollectionRecordFieldSwitch } from "~/collections/components/collection-record-field-row/collection-record-field-switch";
import {
	hasEditedText,
	parseEditedText,
	toEditableText,
} from "~/collections/helpers/record-field-display";
import type { RecordField } from "~/collections/helpers/record-fields";

/**
 * the test hooks a row publishes, derived from the field's own name: the row
 * itself, and its control, its value, and its message suffixed. one function so
 * the set cannot drift apart, and the Maestro flows that drive this screen have
 * one shape to match.
 */
function recordFieldRowTestID(name: string): string {
	return `record-field-${name}`;
}

/**
 * one field of a record: its label and Payload name on one line, and the
 * control that edits it — or the reason it cannot be edited — at full width
 * beneath. a refused save adds the server's own message under that.
 *
 * the row holds what is being edited rather than reading it off the record, and
 * seeds it **once**. that is what lets a refused value stay in the input for the
 * user to correct, what keeps a switch in the position it was moved to while
 * the change is still queued, and what stops a background refetch from
 * replacing a half-typed field: the record's value is where the row starts, not
 * what it shows from then on. a saved field is patched into the cache with the
 * value this row sent, so the two do not drift.
 *
 * saving is the caller's, through `onSave`. the row never writes to the server
 * itself — every change goes through the pending-write queue, which is what
 * makes an edit survive having no connection and keeps two saves on one record
 * from interleaving.
 */
export function CollectionRecordFieldRow({
	field,
	isQueued,
	onSave,
	refusalMessage,
}: Readonly<{
	field: RecordField;
	/** the row's change has not reached the server yet. */
	isQueued: boolean;
	/** hands the caller a value to save. fired on blur, or on a switch's toggle. */
	onSave: (fieldName: string, value: unknown) => void;
	/** what the server said about a refused save, and `null` when none was. */
	refusalMessage: string | null;
}>): JSX.Element {
	const [text, setText] = useState(() => toEditableText(field));
	const [isOn, setIsOn] = useState(field.value === true);
	// whether this input has been typed into since it was seeded or last saved.
	// a ref rather than state: nothing on screen changes with it, so making it
	// state would only re-render the row on the first keystroke.
	const hasTypedRef = useRef(false);
	const testID = recordFieldRowTestID(field.name);
	const isRefused = refusalMessage !== null;

	// a refusal is the more urgent of the two and takes the line: editing the
	// field again clears it, at which point the row is queued once more.
	const marker = isRefused ? "refused" : isQueued ? "queued" : undefined;

	function edit(next: string): void {
		hasTypedRef.current = true;
		setText(next);
	}

	// a blur that changed nothing sends nothing, and text that does not parse is
	// not sent at all — the server would answer 200 and quietly store `null`, so
	// nothing downstream could report the loss.
	//
	// "changed nothing" is asked of the *user* first, and only then of the text.
	// the row seeds once and `field.value` does not: a background refetch moves
	// it while the input stands still, so a comparison against it alone would
	// read an untouched input as an edit and send the seeded text — reverting
	// whatever another account had saved in the meantime, at a 200 nothing
	// surfaces. the text comparison stays as the second guard, so typing a
	// character and undoing it still sends nothing.
	function commit(): void {
		if (!hasTypedRef.current || !hasEditedText(field, text)) {
			return;
		}

		const parsed = parseEditedText(field, text);

		if (parsed !== null) {
			onSave(field.name, parsed.value);
			// what was typed is now what was sent, so the next blur is untouched
			// again until the user types once more.
			hasTypedRef.current = false;
		}
	}

	function toggle(value: boolean): void {
		setIsOn(value);
		onSave(field.name, value);
	}

	let control: JSX.Element;
	// `field.kind === "none"` is belt and braces, and is kept deliberately: a
	// `null` value already yields the `no-value` read-only reason, so the first
	// half of this test always catches it today. what it guards is a field
	// arriving from anywhere that does not pair the two — the row would put an
	// empty text input over a value it has no editor for.
	if (!field.isEditable || field.kind === "none") {
		control = (
			<CollectionRecordFieldStatic field={field} testID={`${testID}-value`} />
		);
	} else if (field.kind === "boolean") {
		control = (
			<CollectionRecordFieldSwitch
				accessibilityLabel={field.label}
				onValueChange={toggle}
				testID={`${testID}-input`}
				value={isOn}
			/>
		);
	} else {
		control = (
			<CollectionRecordFieldInput
				accessibilityLabel={field.label}
				isRefused={isRefused}
				kind={field.kind}
				onChangeText={edit}
				onCommit={commit}
				testID={`${testID}-input`}
				value={text}
			/>
		);
	}

	return (
		<View style={styles.row} testID={testID}>
			<CollectionRecordFieldHead
				label={field.label}
				marker={marker}
				markerTestID={marker === undefined ? undefined : `${testID}-${marker}`}
				name={field.name}
			/>
			{control}
			{refusalMessage === null ? null : (
				<CollectionRecordFieldError
					message={refusalMessage}
					testID={`${testID}-error`}
				/>
			)}
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	row: {
		rowGap: theme.gap.xs,
	},
}));
