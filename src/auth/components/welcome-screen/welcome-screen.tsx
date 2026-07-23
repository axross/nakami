import { useRouter } from "expo-router";
import type { JSX } from "react";
import { Pressable, Text } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { MessageState } from "~/common/components/message-state/message-state";

/**
 * The signed-out landing screen: guides the user to connect their Payload
 * server with a primary call to action that opens the sign-in screen. It is the
 * single non-tab surface shown while unauthenticated — the tab UI mounts only
 * after a successful sign-in.
 *
 * The Sign in button navigates via `onPress`/`router.push`, not `Link asChild`:
 * cloning a Unistyles-styled `Pressable` through `Link asChild` drops its
 * computed style on the release build (the clone takes over the ref Unistyles
 * applies styles through — see `CollectionListItem`'s note), which left this
 * button rendering invisibly (its accent background never painted). The style
 * is kept static, with an Android ripple for press feedback.
 */
export function WelcomeScreen(): JSX.Element {
	const router = useRouter();

	return (
		<MessageState
			action={
				<Pressable
					accessibilityRole="button"
					android_ripple={{ color: "rgba(255, 255, 255, 0.24)" }}
					onPress={() => {
						router.push("/sign-in");
					}}
					style={styles.button}
					testID="welcome-sign-in-button"
				>
					<Text style={styles.buttonLabel}>Sign in</Text>
				</Pressable>
			}
			iconName="database-outline"
			subtitle="Sign in to your Payload CMS to browse your collections."
			testID="welcome-screen"
			title="Connect to Payload"
		/>
	);
}

const styles = StyleSheet.create((theme) => ({
	button: {
		alignItems: "center",
		alignSelf: "stretch",
		backgroundColor: theme.colors.accent,
		borderRadius: theme.radiusSizes.md,
		justifyContent: "center",
		marginTop: theme.gapSizes.x16,
		minHeight: 50,
		overflow: "hidden",
	},
	buttonLabel: {
		color: theme.colors.accentContrast,
		fontSize: theme.fontSizes.md,
		fontWeight: "600",
	},
}));
