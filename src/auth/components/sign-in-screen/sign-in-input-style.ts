import type { UnistylesThemes } from "react-native-unistyles";

/**
 * The sign-in form's text-input surface, in both of its states: the neutral one
 * and the flagged one a validation message puts it in.
 *
 * It lives here rather than in each screen part's own stylesheet because the
 * flagged treatment — a destructive border over a tinted destructive ground —
 * is one design decision spread across four inputs: the three the screen draws
 * directly, and the one inside the Collection field. Declared per stylesheet, a
 * retune reaches three of the four and nothing fails.
 *
 * A plain function of the theme rather than a `StyleSheet`, because Unistyles
 * stylesheets do not compose: each consumer keeps its own
 * `StyleSheet.create` and spends this through a dynamic style function, which
 * is what keeps the theme reactive at the use site.
 *
 * The return type is deliberately inferred rather than annotated as a
 * `TextStyle`: Unistyles accepts a narrower value type than React Native's, so
 * widening this to `TextStyle` makes it unassignable at every use site.
 */
export function signInInputStyle(
	theme: UnistylesThemes["light"],
	flagged: boolean,
) {
	return {
		...theme.typography.body,
		backgroundColor: flagged
			? theme.colors.foundation.destructive.subtle
			: theme.colors.foundation.neutral.subtle,
		borderColor: flagged
			? theme.colors.border.destructive.base
			: theme.colors.border.neutral.subtle,
		borderRadius: theme.radius.md,
		borderWidth: theme.borderWidth.hairline,
		color: theme.colors.text.neutral.intense,
		minHeight: 48,
		paddingHorizontal: theme.gap.sm,
	};
}
