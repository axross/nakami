import type { JSX } from "react";
import { useState } from "react";
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
	const testID = recordFieldRowTestID(field.name);
	const isRefused = refusalMessage !== null;

	// a refusal is the more urgent of the two and takes the line: editing the
	// field again clears it, at which point the row is queued once more.
	const marker = isRefused ? "refused" : isQueued ? "queued" : undefined;

	// a blur that changed nothing sends nothing, and text that does not parse is
	// not sent at all — the server would answer 200 and quietly store `null`, so
	// nothing downstream could report the loss.
	function commit(): void {
		if (!hasEditedText(field, text)) {
			return;
		}

		const parsed = parseEditedText(field, text);

		if (parsed !== null) {
			onSave(field.name, parsed.value);
		}
	}

	function toggle(value: boolean): void {
		setIsOn(value);
		onSave(field.name, value);
	}

	let control: JSX.Element;
	// `none` joins the read-only branch on its own account rather than only
	// through `isEditable`: a field holding `null` has no value to put in a
	// control, whatever else the access response says about it.
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
				onChangeText={setText}
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
				markerTestID={`${testID}-${marker ?? "marker"}`}
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
