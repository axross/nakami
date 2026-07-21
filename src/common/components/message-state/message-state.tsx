import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import type { JSX, ReactNode } from "react";
import { type StyleProp, Text, View, type ViewStyle } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

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
					color={iconColor ?? theme.colors.accent}
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
		backgroundColor: theme.colors.backgroundElevated,
		borderRadius: theme.radiusSizes.lg,
		justifyContent: "center",
		marginBottom: theme.gapSizes.x8,
		width: 66,
	},
	root: {
		alignItems: "center",
		backgroundColor: theme.colors.background,
		flex: 1,
		justifyContent: "center",
		padding: theme.gapSizes.x24,
		rowGap: theme.gapSizes.x8,
	},
	subtitle: {
		color: theme.colors.textSecondary,
		fontSize: theme.fontSizes.md,
		maxWidth: 280,
		textAlign: "center",
	},
	title: {
		color: theme.colors.textPrimary,
		fontSize: theme.fontSizes.lg,
		fontWeight: "600",
	},
}));
