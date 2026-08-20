import type { JSX } from "react";
import { Switch, Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { describeBoolean } from "~/collections/helpers/record-field-display";

/**
 * a boolean field's control: the value stated in words at the start of the row
 * and the switch at its end, inside the same bordered surface every other
 * control draws.
 *
 * this is the one control that saves on **change** rather than on blur. a
 * switch has no focus to lose — toggling it is the whole edit, and there is no
 * later moment at which the user is done with it. the value it sends is the
 * position it was moved to, so nothing is parsed and nothing can fail to parse.
 */
export function CollectionRecordFieldSwitch({
	accessibilityLabel,
	onValueChange,
	testID,
	value,
}: Readonly<{
	accessibilityLabel: string;
	onValueChange: (value: boolean) => void;
	testID: string;
	value: boolean;
}>): JSX.Element {
	const { theme } = useUnistyles();

	return (
		<View style={styles.row}>
			<Text style={styles.value}>{describeBoolean(value)}</Text>
			<Switch
				accessibilityLabel={accessibilityLabel}
				onValueChange={onValueChange}
				testID={testID}
				thumbColor={theme.colors.text.onAccent}
				trackColor={{
					false: theme.colors.border.neutral.base,
					true: theme.colors.solid.accent.base,
				}}
				value={value}
			/>
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	// the same bordered, elevated surface the text controls draw, so a row's
	// value area reads the same whichever control fills it. the vertical padding
	// is a step smaller than theirs because the switch is taller than a line of
	// text and would otherwise make this row the tallest on the screen.
	row: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		columnGap: theme.gap.sm,
		minHeight: 48,
		paddingHorizontal: theme.gap.sm,
		paddingVertical: theme.gap.xs,
		backgroundColor: theme.colors.foundation.neutral.subtle,
		borderColor: theme.colors.border.neutral.subtle,
		borderWidth: theme.borderWidth.hairline,
		borderRadius: theme.radius.md,
	},
	value: {
		...theme.typography.body,
		flexShrink: 1,
		color: theme.colors.text.neutral.intense,
	},
}));
