import { CloudOff } from "lucide-react-native";
import type { JSX } from "react";
import { Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

/** the mark's own size — a fixed element dimension, not a spacing step. */
const ICON_SIZE = 15;

/**
 * the notice above a record whose screen is still fully usable with no
 * connection: editing goes on working, and what is typed is held until the
 * device can reach the server again.
 *
 * it is a band across the top of the fields rather than a replacement for them,
 * because there is nothing here for the user to do and nothing to wait for —
 * the record is on screen and the queue sends itself. the message-state surface
 * the load path uses would be wrong for the same reason: that one appears when
 * there is no record to show.
 */
export function CollectionRecordOfflineNotice({
	testID = "collection-record-offline-notice",
}: Readonly<{ testID?: string }>): JSX.Element {
	const { theme } = useUnistyles();

	return (
		<View
			accessible
			accessibilityRole="alert"
			style={styles.band}
			testID={testID}
		>
			<CloudOff color={theme.colors.text.neutral.base} size={ICON_SIZE} />
			<Text style={styles.message}>
				Offline — changes are queued and will send when you reconnect
			</Text>
		</View>
	);
}

const styles = StyleSheet.create((theme, rt) => ({
	// it spans the screen rather than sitting inside the fields' gutter, so it
	// reads as chrome under the header rather than as the first row. that makes
	// the horizontal inset this band's own, floored against the same gutter the
	// fields use.
	band: {
		flexDirection: "row",
		alignItems: "center",
		columnGap: theme.gap.xs,
		paddingVertical: theme.gap.xs,
		paddingStart: Math.max(rt.insets.left, theme.gap.md),
		paddingEnd: Math.max(rt.insets.right, theme.gap.md),
		backgroundColor: theme.colors.surface.neutral.base,
		borderBottomColor: theme.colors.border.neutral.subtle,
		borderBottomWidth: theme.borderWidth.hairline,
	},
	message: {
		...theme.typography.caption,
		flexShrink: 1,
		color: theme.colors.text.neutral.base,
	},
}));
