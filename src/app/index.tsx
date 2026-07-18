import { Stack } from "expo-router";
import type { JSX } from "react";
import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export default function HomeRoute(): JSX.Element {
	return (
		<>
			<Stack.Screen options={{ title: "Payload Mobile" }} />
			<View style={styles.root} testID="home-screen">
				<Text style={styles.title}>Payload Mobile</Text>
				<Text style={styles.subtitle}>
					A companion mobile app for Payload MCP.
				</Text>
			</View>
		</>
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
		fontSize: theme.fontSizes.xl,
		fontWeight: "600",
	},
}));
