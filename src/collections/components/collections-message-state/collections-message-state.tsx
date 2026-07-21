import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import type { JSX } from "react";
import { Pressable, Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

interface MessageAction {
	readonly label: string;
	readonly onPress: () => void;
	readonly testID?: string;
}

/**
 * A centered mark + title + subtitle surface for the Collections screen's empty
 * and error states, mirroring the Home empty state. An optional action renders
 * a primary button (the error state's retry).
 */
export function CollectionsMessageState({
	iconName,
	iconColor,
	title,
	subtitle,
	action,
	testID,
}: Readonly<{
	iconName: keyof typeof MaterialCommunityIcons.glyphMap;
	iconColor?: string;
	title: string;
	subtitle: string;
	action?: MessageAction;
	testID?: string;
}>): JSX.Element {
	const { theme } = useUnistyles();

	return (
		<View style={styles.root} testID={testID}>
			<View style={styles.mark}>
				<MaterialCommunityIcons
					color={iconColor ?? theme.colors.accent}
					name={iconName}
					size={34}
				/>
			</View>

			<Text style={styles.title}>{title}</Text>
			<Text style={styles.subtitle}>{subtitle}</Text>

			{action ? (
				<Pressable
					accessibilityRole="button"
					onPress={action.onPress}
					style={({ pressed }) => styles.button(pressed)}
					testID={action.testID}
				>
					<Text style={styles.buttonLabel}>{action.label}</Text>
				</Pressable>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	button: (pressed: boolean) => ({
		alignItems: "center",
		backgroundColor: theme.colors.accent,
		borderRadius: theme.radiusSizes.md,
		justifyContent: "center",
		marginTop: theme.gapSizes.x16,
		minHeight: 48,
		opacity: pressed ? 0.7 : 1,
		paddingHorizontal: theme.gapSizes.x24,
	}),
	buttonLabel: {
		color: theme.colors.accentContrast,
		fontSize: theme.fontSizes.md,
		fontWeight: "600",
	},
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
