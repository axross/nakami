import { Link } from "expo-router";
import type { JSX } from "react";
import { Pressable, Text } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { MessageState } from "~/common/components/message-state/message-state";

/**
 * The signed-out landing screen: guides the user to connect their Payload
 * server with a primary call to action that opens the sign-in screen. It is the
 * single non-tab surface shown while unauthenticated — the tab UI mounts only
 * after a successful sign-in.
 */
export function WelcomeScreen(): JSX.Element {
	return (
		<MessageState
			action={
				<Link asChild href="/sign-in">
					<Pressable
						accessibilityRole="button"
						style={({ pressed }) => styles.button(pressed)}
						testID="welcome-sign-in-button"
					>
						<Text style={styles.buttonLabel}>Sign in</Text>
					</Pressable>
				</Link>
			}
			iconName="database-outline"
			subtitle="Sign in to your Payload CMS to browse your collections."
			testID="welcome-screen"
			title="Connect to Payload"
		/>
	);
}

const styles = StyleSheet.create((theme) => ({
	button: (pressed: boolean) => ({
		alignItems: "center",
		alignSelf: "stretch",
		backgroundColor: theme.colors.accent,
		borderRadius: theme.radiusSizes.md,
		justifyContent: "center",
		minHeight: 50,
		opacity: pressed ? 0.7 : 1,
	}),
	buttonLabel: {
		color: theme.colors.accentContrast,
		fontSize: theme.fontSizes.md,
		fontWeight: "600",
	},
}));
