import type { JSX } from "react";
import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import {
	describeReadOnlyReason,
	formatReadOnlyValue,
} from "~/collections/helpers/record-field-display";
import type { RecordField } from "~/collections/helpers/record-fields";

/**
 * what a read-only row shows where its control would be: the value at the start
 * and the reason it cannot be edited at the end, in the same bordered surface
 * an editable row draws so the screen reads as one list rather than two.
 *
 * the reason is stated in words rather than implied by a disabled control. a
 * disabled input says only that something is wrong; "No permission" and
 * "Server-assigned" are different facts about the record, and a reader who
 * cannot act on one may well be able to act on the other. it is also what the
 * row announces to a screen reader, which is why the pair is one accessible
 * element rather than two independently focusable texts.
 */
export function CollectionRecordFieldStatic({
	field,
	testID,
}: Readonly<{ field: RecordField; testID: string }>): JSX.Element {
	const value = formatReadOnlyValue(field);
	const reason =
		field.readOnlyReason === null
			? null
			: describeReadOnlyReason(field.readOnlyReason);

	return (
		<View
			accessible
			accessibilityLabel={
				reason === null ? value : `${field.label}: ${value}. ${reason}.`
			}
			style={styles.surface}
			testID={testID}
		>
			<Text style={styles.value}>{value}</Text>
			{reason === null ? null : <Text style={styles.reason}>{reason}</Text>}
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	// both halves of this row shrink, unlike the label line above it: neither is
	// the one that must survive whole. a long value and a long reason wrap
	// against each other rather than one pushing the other off the row, which is
	// what the design shows for the longest of the four reasons.
	reason: {
		...theme.typography.caption,
		flexShrink: 1,
		textAlign: "right",
		color: theme.colors.text.neutral.base,
	},
	// the editable controls' surface at one step down: the bare foundation rather
	// than the raised one, so a row that cannot be typed into does not look like
	// one that can while still sitting in the same bordered frame.
	surface: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		columnGap: theme.gap.sm,
		minHeight: 48,
		padding: theme.gap.sm,
		backgroundColor: theme.colors.foundation.neutral.bare,
		borderColor: theme.colors.border.neutral.subtle,
		borderWidth: theme.borderWidth.hairline,
		borderRadius: theme.radius.md,
	},
	// the monospace role, because a read-only value is the server's own string
	// shown verbatim — an id, a timestamp, a serialized structure — rather than
	// prose this app composed.
	value: {
		...theme.typography.code,
		flexShrink: 1,
		color: theme.colors.text.neutral.intense,
	},
}));
