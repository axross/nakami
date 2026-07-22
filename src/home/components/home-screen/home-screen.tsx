import type { JSX } from "react";
import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useAuthStatus } from "~/auth/stores/auth-store";
import { HomeEmptyState } from "~/home/components/home-empty-state/home-empty-state";

export function HomeScreen(): JSX.Element {
	const status = useAuthStatus();

	// Signed out (or still resolving behind the splash): guide the user to sign
	// in. Authenticated: the unchanged placeholder Home.
	if (status !== "authenticated") {
		return <HomeEmptyState />;
	}

	return (
		<View style={styles.root} testID="home-screen">
			<Text style={styles.title}>Nakami</Text>
			<Text style={styles.subtitle}>
				A companion mobile app for Payload CMS.
			</Text>
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
		fontSize: theme.fontSizes.xl,
		fontWeight: "600",
	},
}));
