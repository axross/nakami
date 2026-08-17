import type { UnistylesThemes } from "react-native-unistyles";

// react-native-unistyles exports the map of registered themes but not the single
// theme a stylesheet's callback receives, so derive it from that map.
type Theme = UnistylesThemes[keyof UnistylesThemes];

/**
 * The chrome every row of a setting menu group shares: the surface fill and the
 * row layout. Both row parts spread it into their own `StyleSheet.create` object
 * literal, so the interactive and the static row cannot drift apart.
 */
export function getSettingMenuGroupItemChrome(theme: Theme) {
	return {
		alignItems: "center",
		backgroundColor: theme.colors.foundation.neutral.subtle,
		columnGap: theme.gap.md,
		flexDirection: "row",
		minHeight: 48,
		paddingHorizontal: theme.gap.md,
		paddingVertical: theme.gap.xs,
	} as const;
}

/**
 * The corners each position rounds — the ends of the group, and nothing in
 * between. The rows sit flush, so a group reads as one surface with rounded ends
 * rather than as a stack of rounded cards.
 *
 * This is the value of a `variants.position` key that both row parts write out
 * **literally** inside `StyleSheet.create`. Spreading a helper whose result
 * already carries `variants` does not work: Unistyles' Babel plugin detects the
 * group by reading the key in the object literal, so a spread-in group records no
 * variants dependency and the corners never follow a position change.
 */
export function getSettingMenuGroupItemPositionVariants(theme: Theme) {
	return {
		first: {
			borderTopLeftRadius: theme.radius.md,
			borderTopRightRadius: theme.radius.md,
		},
		middle: {},
		last: {
			borderBottomLeftRadius: theme.radius.md,
			borderBottomRightRadius: theme.radius.md,
		},
		only: {
			borderRadius: theme.radius.md,
		},
		// Unreachable through the context, whose hook throws rather than yielding
		// an absent position — but a variant group without a `default` renders
		// nothing at all when a selection is missing, so the square-cornered
		// middle treatment is the fallback.
		default: {},
	};
}
