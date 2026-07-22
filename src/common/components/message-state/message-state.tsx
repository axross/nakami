import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import type { JSX, ReactNode } from "react";
import { type StyleProp, Text, View, type ViewStyle } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

/** The icon glyph names {@link MessageState} accepts, from the MaterialCommunityIcons set. */
export type MessageStateIconName = keyof typeof MaterialCommunityIcons.glyphMap;

/**
 * A centered "mark + title + subtitle" surface with an optional action slot —
 * the shared shape behind feature empty/error/placeholder screens (Home's
 * connect prompt, the Collections empty/error/detail states). Callers pass
 * their own action element so each keeps its distinct control (a navigation
 * link, a retry button).
 */
export function MessageState({
	iconName,
	iconColor,
	title,
	subtitle,
	action,
	testID,
	style,
}: Readonly<{
	iconName: MessageStateIconName;
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
				<MaterialCommunityIcons
					color={iconColor ?? theme.colors.text.accent.base}
					name={iconName}
					size={34}
				/>
			</View>

			<Text style={styles.title}>{title}</Text>
			<Text style={styles.subtitle}>{subtitle}</Text>

			{action}
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
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
		padding: theme.gap.lg,
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
