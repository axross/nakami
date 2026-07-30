import type { LucideIcon } from "lucide-react-native";
import type { JSX, ReactNode } from "react";
import { type StyleProp, Text, View, type ViewStyle } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

/**
 * A centered "mark + title + subtitle" surface with an optional action slot —
 * the shared shape behind feature empty/error/placeholder screens (Home's
 * connect prompt, the Collections empty/error/detail states). Callers pass
 * their own action element so each keeps its distinct control (a navigation
 * link, a retry button).
 *
 * It fills its screen, so it carries the horizontal safe-area inset itself —
 * the one edge pair no navigator chrome ever clears. A caller that also owns a
 * vertical edge (the welcome screen, which has neither a header nor a tab bar)
 * overrides `paddingTop`/`paddingBottom` through `style`.
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
		color: theme.colors.text.neutral.base,
		fontFamily: theme.fonts.paragraph,
		fontSize: 16,
		maxWidth: 280,
		textAlign: "center",
	},
	title: {
		color: theme.colors.text.neutral.intense,
		fontFamily: theme.fonts.heading,
		fontSize: 20,
	},
}));
