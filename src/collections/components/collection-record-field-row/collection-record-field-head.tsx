import type { JSX } from "react";
import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import {
	CollectionRecordFieldMarker,
	type RecordFieldMarkerTone,
} from "~/collections/components/collection-record-field-row/collection-record-field-marker";

/**
 * a field row's label line: the derived label at the start, the Payload field
 * name pushed to the end, and the row's state marker after it. both identifiers
 * are shown in every row state — a read-only row and a refused one name their
 * field exactly as an editable one does.
 *
 * the two share one line, and when they do not both fit **the field name is
 * what truncates**: the label is the readable half and losing its end costs the
 * reader the field's meaning, while a clipped name still identifies it against
 * the collection's config. so the label never shrinks, the name shrinks and
 * ellipsizes at its tail, and every row keeps the same height whatever its
 * identifiers are — no measurement pass, and no row that silently becomes two
 * lines tall.
 */
export function CollectionRecordFieldHead({
	label,
	marker,
	markerTestID,
	name,
}: Readonly<{
	label: string;
	marker?: RecordFieldMarkerTone;
	markerTestID?: string;
	name: string;
}>): JSX.Element {
	return (
		<View style={styles.head}>
			<Text style={styles.label}>{label}</Text>
			<Text numberOfLines={1} style={styles.name}>
				{name}
			</Text>
			{marker === undefined ? null : (
				<CollectionRecordFieldMarker testID={markerTestID} tone={marker} />
			)}
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	// `alignItems: "baseline"` rather than `center`: the two identifiers are set
	// in different families at different sizes, and they read as one line only
	// when they sit on one baseline. `caption` and `codeCaption` share an 18pt
	// line box, which is what makes that baseline the same for both.
	head: {
		flexDirection: "row",
		alignItems: "baseline",
		columnGap: theme.gap.xs,
	},
	label: {
		...theme.typography.caption,
		// never the element that gives way — see this component's own note.
		flexShrink: 0,
		color: theme.colors.text.neutral.intense,
	},
	// `marginStart: "auto"` puts the name at the end of the line while leaving it
	// free to shrink; `justifyContent: "space-between"` could not, because the
	// marker after it would then be spaced away from the name it belongs to.
	name: {
		...theme.typography.codeCaption,
		flexShrink: 1,
		marginStart: "auto",
		color: theme.colors.text.neutral.base,
	},
}));
