import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Link } from "expo-router";
import type { JSX } from "react";
import { Pressable, Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

/**
 * The signed-out Home surface: guides the user to connect their Payload server
 * with a primary call to action that opens the sign-in screen.
 */
export function HomeEmptyState(): JSX.Element {
	const { theme } = useUnistyles();

	return (
		<View style={styles.root} testID="home-screen">
			<View style={styles.mark}>
				<MaterialCommunityIcons
					color={theme.colors.accent}
					name="database-outline"
					size={34}
				/>
			</View>

			<Text style={styles.title}>Connect to Payload</Text>
			<Text style={styles.subtitle}>
				Sign in to your Payload CMS to browse your collections.
			</Text>

			<Link asChild href="/sign-in">
				<Pressable
					accessibilityRole="button"
					style={({ pressed }) => styles.button(pressed)}
					testID="home-sign-in-button"
				>
					<Text style={styles.buttonLabel}>Sign in</Text>
				</Pressable>
			</Link>
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	button: (pressed: boolean) => ({
		alignItems: "center",
		alignSelf: "stretch",
		backgroundColor: theme.colors.accent,
		borderRadius: theme.radiusSizes.md,
		justifyContent: "center",
		marginTop: theme.gapSizes.x16,
		minHeight: 50,
		opacity: pressed ? 0.7 : 1,
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
