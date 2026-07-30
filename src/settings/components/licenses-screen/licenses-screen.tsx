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

const styles = StyleSheet.create((theme, rt) => ({
	placeholder: {
		color: theme.colors.text.neutral.base,
		fontFamily: theme.fonts.paragraph,
		fontSize: 16,
		textAlign: "center",
	},
	// The stack header and the tab bar clear this screen's vertical edges, so
	// only the horizontal inset is its own.
	root: {
		alignItems: "center",
		backgroundColor: theme.colors.foundation.neutral.bare,
		flex: 1,
		justifyContent: "center",
		paddingBottom: theme.gap.lg,
		paddingEnd: Math.max(rt.insets.right, theme.gap.lg),
		paddingStart: Math.max(rt.insets.left, theme.gap.lg),
		paddingTop: theme.gap.lg,
	},
}));
