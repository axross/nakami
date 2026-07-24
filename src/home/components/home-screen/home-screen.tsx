import type { JSX } from "react";
import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

/**
 * The Home tab surface. Home renders only while authenticated — the root
 * navigator gates the whole tab UI behind sign-in — so there is no signed-out
 * branch here; the signed-out landing lives in the welcome screen.
 */
export function HomeScreen(): JSX.Element {
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
		textAlign: "center",
	},
	title: {
		color: theme.colors.text.neutral.intense,
		fontFamily: theme.fonts.heading,
		fontSize: 28,
	},
}));
