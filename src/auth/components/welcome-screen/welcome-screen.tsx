import { useRouter } from "expo-router";
import { Database } from "lucide-react-native";
import type { JSX } from "react";
import { Pressable, Text } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { MessageState } from "~/common/components/message-state/message-state";

/**
 * the signed-out landing screen: guides the user to connect their Payload
 * server with a primary call to action that opens the sign-in screen. it is the
 * single non-tab surface shown while unauthenticated — the tab UI mounts only
 * after a successful sign-in.
 *
 * the Sign in button navigates via `onPress`/`router.push`, not `Link asChild`:
 * cloning a Unistyles-styled `Pressable` through `Link asChild` drops its
 * computed style on the release build (the clone takes over the ref Unistyles
 * applies styles through — see `CollectionListItem`'s note), which left this
 * button rendering invisibly (its accent background never painted). press
 * feedback is the codebase's standard pressed-opacity dip, applied through the
 * `Pressable`'s own render-prop `style` (the same pattern as `CollectionRow`,
 * which proves it paints on release) — no `Link asChild` cloning involved.
 */
export function WelcomeScreen(): JSX.Element {
	const router = useRouter();

	return (
		<MessageState
			action={
				<Pressable
					accessibilityRole="button"
					onPress={() => {
						router.push("/sign-in");
					}}
					style={({ pressed }) => [
						styles.button,
						pressed && styles.buttonPressed,
					]}
					testID="welcome-sign-in-button"
				>
					<Text style={styles.buttonLabel}>Sign in</Text>
				</Pressable>
			}
			icon={Database}
			style={styles.messageState}
			subtitle="Sign in to your Payload CMS to browse your collections."
			testID="welcome-screen"
			title="Connect to Payload"
		/>
	);
}

const styles = StyleSheet.create((theme, rt) => ({
	button: {
		alignItems: "center",
		justifyContent: "center",
		alignSelf: "stretch",
		minHeight: 50,
		marginTop: theme.gap.md,
		backgroundColor: theme.colors.solid.accent.base,
		borderRadius: theme.radius.md,
	},
	buttonLabel: {
		...theme.typography.heading,
		color: theme.colors.text.onAccent,
	},
	buttonPressed: {
		opacity: 0.6,
	},
	// `MessageState` claims no space of its own, so the consumer decides how much
	// room it gets; this screen is the whole signed-out surface.
	//
	// it is also the one screen with neither a header nor a tab bar, so it owns
	// all four edges. `MessageState` already carries the horizontal pair for every
	// call site; the vertical pair is added here, through the same `style` prop
	// that supplies the fill.
	messageState: {
		flex: 1,
		paddingTop: Math.max(rt.insets.top, theme.gap.lg),
		paddingBottom: Math.max(rt.insets.bottom, theme.gap.lg),
	},
}));
