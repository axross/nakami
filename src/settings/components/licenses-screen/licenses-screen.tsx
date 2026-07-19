import type { JSX } from "react";
import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export function LicensesScreen(): JSX.Element {
	return (
		<View style={styles.root} testID="licenses-screen">
			<Text style={styles.placeholder}>
				License information is not available yet.
			</Text>
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	placeholder: {
		color: theme.colors.textSecondary,
		fontSize: theme.fontSizes.md,
		textAlign: "center",
	},
	root: {
		alignItems: "center",
		backgroundColor: theme.colors.background,
		flex: 1,
		justifyContent: "center",
		padding: theme.gapSizes.x24,
	},
}));
