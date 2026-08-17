import type { JSX } from "react";
import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

/**
 * the Home tab surface. Home renders only while authenticated — the root
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

const styles = StyleSheet.create((theme, rt) => ({
	// the tab group hides its header, so this screen owns the top edge as well
	// as the horizontal pair; the tab bar pads itself by the bottom inset.
	root: {
		alignItems: "center",
		justifyContent: "center",
		rowGap: theme.gap.xs,
		flex: 1,
		paddingTop: Math.max(rt.insets.top, theme.gap.lg),
		paddingBottom: theme.gap.lg,
		paddingStart: Math.max(rt.insets.left, theme.gap.lg),
		paddingEnd: Math.max(rt.insets.right, theme.gap.lg),
		backgroundColor: theme.colors.foundation.neutral.bare,
	},
	subtitle: {
		...theme.typography.body,
		color: theme.colors.text.neutral.base,
		textAlign: "center",
	},
	title: {
		...theme.typography.display,
		color: theme.colors.text.neutral.intense,
	},
}));
