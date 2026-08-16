import type { LucideIcon } from "lucide-react-native";
import type { JSX, ReactNode } from "react";
import { type StyleProp, Text, View, type ViewStyle } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

/**
 * A centered "mark + title + subtitle" surface with an optional action slot —
 * the shared shape behind feature empty/error/placeholder screens. Callers pass
 * their own action element so each keeps its distinct control (a navigation
 * link, a retry button).
 *
 * Rendered by `welcome-screen` directly and by `collections-message-state`, which
 * the Collections list and record screens both use. That inventory is load-bearing
 * rather than descriptive: the horizontal safe-area inset below is carried here on
 * every call site's behalf, so it only reaches the screen edge while each of them
 * renders this component full-bleed.
 */
export function MessageState({
	icon: Icon,
	iconColor,
	title,
	subtitle,
	action,
	testID,
	style,
}: Readonly<{
	icon: LucideIcon;
	iconColor?: string;
	title: string;
	subtitle: string;
	action?: ReactNode;
	testID?: string;
	style?: StyleProp<ViewStyle>;
}>): JSX.Element {
	const { theme } = useUnistyles();

	return (
		<View style={[styles.root, style]} testID={testID}>
			<View style={styles.mark}>
				<Icon color={iconColor ?? theme.colors.text.accent.base} size={34} />
			</View>

			<Text style={styles.title}>{title}</Text>
			<Text style={styles.subtitle}>{subtitle}</Text>

			{action}
		</View>
	);
}

const styles = StyleSheet.create((theme, rt) => ({
	mark: {
		alignItems: "center",
		aspectRatio: 1,
		backgroundColor: theme.colors.foundation.neutral.subtle,
		borderRadius: theme.gap.md,
		justifyContent: "center",
		marginBottom: theme.gap.xs,
		width: 66,
	},
	// This surface is `flex: 1` and full-bleed at every call site, so it carries
	// the horizontal safe-area inset once on their behalf. The vertical pair is
	// left as the plain gutter: a caller that owns its top or bottom edge (the
	// welcome screen) overrides it through `style`, which comes last in the array
	// and therefore wins. That array order is load-bearing — reversing it would
	// make every consumer override lose — and the test that holds it lives beside
	// this file. Both sides are written as longhands so no shorthand-versus-
	// longhand precedence is involved in reading which value applies.
	root: {
		alignItems: "center",
		backgroundColor: theme.colors.foundation.neutral.bare,
		flex: 1,
		justifyContent: "center",
		paddingBottom: theme.gap.lg,
		paddingEnd: Math.max(rt.insets.right, theme.gap.lg),
		paddingStart: Math.max(rt.insets.left, theme.gap.lg),
		paddingTop: theme.gap.lg,
		rowGap: theme.gap.xs,
	},
	subtitle: {
		...theme.typography.body,
		color: theme.colors.text.neutral.base,
		maxWidth: 280,
		textAlign: "center",
	},
	title: {
		...theme.typography.title,
		color: theme.colors.text.neutral.intense,
	},
}));
