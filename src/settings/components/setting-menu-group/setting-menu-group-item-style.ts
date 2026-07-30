import type { UnistylesThemes } from "react-native-unistyles";
import type { SettingMenuGroupItemPosition } from "./setting-menu-group-context";

// react-native-unistyles exports the themes map but not the single-theme type a
// stylesheet's callback receives, so derive it here.
type Theme = UnistylesThemes[keyof UnistylesThemes];

/**
 * The chrome every row of a setting menu group shares: the surface fill, the
 * row layout, and the corners the row's position rounds. Both the pressable
 * `<SettingMenuGroupItem>` and the static `<SettingMenuGroupStaticItem>` build
 * their style from this, so the two cannot drift apart.
 */
export function getSettingMenuGroupItemStyle(
	theme: Theme,
	position: SettingMenuGroupItemPosition,
) {
	const roundsTop = position === "first" || position === "only";
	const roundsBottom = position === "last" || position === "only";

	return {
		alignItems: "center",
		backgroundColor: theme.colors.foundation.neutral.subtle,
		borderBottomLeftRadius: roundsBottom ? theme.gap.sm : 0,
		borderBottomRightRadius: roundsBottom ? theme.gap.sm : 0,
		borderTopLeftRadius: roundsTop ? theme.gap.sm : 0,
		borderTopRightRadius: roundsTop ? theme.gap.sm : 0,
		columnGap: theme.gap.md,
		flexDirection: "row",
		minHeight: 48,
		paddingHorizontal: theme.gap.md,
		paddingVertical: theme.gap.xs,
	} as const;
}
