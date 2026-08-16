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
		...theme.typography.body,
		color: theme.colors.text.neutral.base,
		textAlign: "center",
	},
	// A stack header clears the top edge and the tab bar the bottom, so this
	// screen owns only the horizontal pair.
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
