import type { JSX } from "react";
import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export function CollectionsScreen(): JSX.Element {
	return (
		<View style={styles.root} testID="collections-screen">
			<Text style={styles.title}>Collections</Text>
			<Text style={styles.subtitle}>No collections yet.</Text>
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
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
		textAlign: "center",
	},
	title: {
		color: theme.colors.textPrimary,
		fontSize: theme.fontSizes.lg,
		fontWeight: "600",
	},
}));
