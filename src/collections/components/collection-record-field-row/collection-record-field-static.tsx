import type { JSX } from "react";
import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { CollectionRecordFieldReason } from "~/collections/components/collection-record-field-row/collection-record-field-reason";
import {
	describeReadOnlyReason,
	formatReadOnlyValue,
} from "~/collections/helpers/record-field-display";
import type { RecordField } from "~/collections/helpers/record-fields";

/**
 * what a read-only row shows where its control would be: the value at the start
 * of the same bordered surface an editable row draws, and a mark in the top
 * corner standing for the reason it cannot be edited, which explains itself in
 * a tooltip when tapped.
 *
 * the reason is a mark rather than words, but it is still *stated* rather than
 * implied by a disabled control: "no permission" and "server-assigned" are
 * different facts about the record, and a reader who cannot act on one may well
 * be able to act on the other. what the mark buys is the room the four repeated
 * sentences were taking from every value on screen.
 *
 * the surface is no longer one accessible element. it was, so that a screen
 * reader read the value and its reason as one thing — but the mark is a button
 * now, and a button inside an `accessible` container is not reachable on iOS.
 * so the value carries the pair as its own label, exactly as the container did,
 * and the mark is reachable beside it announcing the same sentence.
 */
export function CollectionRecordFieldStatic({
	field,
	testID,
}: Readonly<{ field: RecordField; testID: string }>): JSX.Element {
	const { readOnlyReason } = field;
	const value = formatReadOnlyValue(field);

	if (readOnlyReason === null) {
		return (
			<View style={styles.surface} testID={testID}>
				<Text accessibilityLabel={value} style={styles.value}>
					{value}
				</Text>
			</View>
		);
	}

	const reason = describeReadOnlyReason(readOnlyReason);

	return (
		<View style={styles.surface} testID={testID}>
			<Text
				accessibilityLabel={`${field.label}: ${value}. ${reason}`}
				style={styles.value}
			>
				{value}
			</Text>
			<CollectionRecordFieldReason
				reason={readOnlyReason}
				testID={`${testID}-reason`}
			/>
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	// the editable controls' surface at one step down: the bare foundation rather
	// than the raised one, so a row that cannot be typed into does not look like
	// one that can while still sitting in the same bordered frame.
	//
	// `alignItems: "flex-start"` rather than `center`: the mark belongs to the
	// whole surface rather than to the value's last line, so it holds the top
	// corner while a serialized object or a long id wraps beneath it. the column
	// gap is a full step rather than a small one because the mark's own pressable
	// box reaches back into it.
	//
	// the value opts back out of that alignment below, because the cross-axis
	// change is the mark's and not the value's — see this stylesheet's `value`.
	surface: {
		flexDirection: "row",
		alignItems: "flex-start",
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
	//
	// `alignSelf: "center"` puts the value back on the centre line the surface
	// gave up for the mark. it matters only for a value shorter than the
	// surface's own minimum height: that one line sits where an editable input's
	// single line sits, so a locked row and a typeable one read against each
	// other rather than one riding higher than the other. a value tall enough to
	// fill the surface is unaffected — the surface grew to fit it, so its centre
	// and its top are the same place.
	value: {
		...theme.typography.code,
		alignSelf: "center",
		flexShrink: 1,
		color: theme.colors.text.neutral.intense,
	},
}));
