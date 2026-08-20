import type { JSX } from "react";
import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

/** what a row's label line can be marked with, past its two identifiers. */
export type RecordFieldMarkerTone = "queued" | "refused";

const LABELS: Record<RecordFieldMarkerTone, string> = {
	queued: "Not saved yet",
	refused: "Refused",
};

/**
 * the state marker on a field row's label line: a change that has not reached
 * the server yet, or one the server would not take.
 *
 * the queued marker carries a filled dot beside its label and the refused one
 * does not, so the two are told apart by shape as well as by tone — the
 * destructive and accent inks are the same lightness to a reader who cannot
 * separate them by hue, and this line is the only place the row states which of
 * the two it is in.
 *
 * it is a plain `Text` inside a row rather than the label's own suffix, so it
 * never shrinks: whatever else gives way on that line, the sentence saying the
 * change is unsaved is not the part that disappears.
 */
export function CollectionRecordFieldMarker({
	testID,
	tone,
}: Readonly<{ testID?: string; tone: RecordFieldMarkerTone }>): JSX.Element {
	return (
		<View style={styles.marker} testID={testID}>
			{tone === "queued" ? <View style={styles.dot} /> : null}
			<Text style={styles.label(tone)}>{LABELS[tone]}</Text>
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	// a fixed element dimension rather than a spacing step: it is a mark sized to
	// sit inside the caption line box beside its own words.
	dot: {
		width: 7,
		aspectRatio: 1,
		backgroundColor: theme.colors.solid.accent.base,
		borderRadius: theme.radius.pill,
	},
	// a dynamic function rather than a variant: a screen draws one of these per
	// row from one component body, and `useVariants` selects once per body — so
	// three rows in three states could not each have been expressed.
	label: (tone: RecordFieldMarkerTone) => ({
		...theme.typography.caption,
		color:
			tone === "refused"
				? theme.colors.text.destructive.base
				: theme.colors.text.accent.base,
	}),
	marker: {
		flexDirection: "row",
		alignItems: "center",
		columnGap: theme.gap.xs,
		flexShrink: 0,
	},
}));
