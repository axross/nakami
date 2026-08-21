import { CircleAlert } from "lucide-react-native";
import type { JSX } from "react";
import { Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

/** the icon's own size — a fixed element dimension, not a spacing step. */
const ICON_SIZE = 16;

/**
 * what is wrong with one field, stated beneath the control that holds it: the
 * server's own words about a save it refused, or the editor's own about text it
 * cannot read back into a value.
 *
 * it renders the message rather than only tinting the control, because the tint
 * says something failed and the message says what — and Payload's own
 * "This field is required." is the only version of a refusal anyone can act on.
 * the icon is the second cue beside the destructive ink, for a reader who
 * cannot separate the two tones by hue.
 *
 * it sits in a directory of its own rather than beside either consumer, because
 * both the record screen's field row and the field editor draw it and neither
 * owns it. it stays inside this feature: nothing outside `src/collections/`
 * renders one, which is the threshold `docs/conventions/directory-structure.md`
 * sets for promoting a component further.
 */
export function CollectionFieldError({
	message,
	testID,
}: Readonly<{ message: string; testID: string }>): JSX.Element {
	const { theme } = useUnistyles();

	return (
		<View
			accessible
			accessibilityLabel={message}
			style={styles.row}
			testID={testID}
		>
			<CircleAlert
				color={theme.colors.text.destructive.base}
				size={ICON_SIZE}
				style={styles.icon}
			/>
			<Text style={styles.message}>{message}</Text>
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	// the mark keeps the first line of a message that wraps, rather than centring
	// itself against the whole block.
	icon: {
		marginTop: theme.borderWidth.thin,
	},
	message: {
		...theme.typography.caption,
		flexShrink: 1,
		color: theme.colors.text.destructive.base,
	},
	row: {
		flexDirection: "row",
		alignItems: "flex-start",
		columnGap: theme.gap.xs,
	},
}));
