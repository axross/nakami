import { CircleAlert } from "lucide-react-native";
import type { ComponentPropsWithRef, JSX } from "react";
import { Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

/**
 * A single field's validation message, rendered directly beneath the input it
 * concerns. The icon is the non-colour cue: the message has to be legible as an
 * error to a reader who cannot tell the destructive text tone from the neutral
 * one around it.
 *
 * `accessibilityLiveRegion` announces the message on Android. It is Android-only
 * in React Native, so the screen pairs it with an `AccessibilityInfo`
 * announcement on iOS — neither platform is left silent, and neither
 * double-announces.
 */
export function SignInFieldError({
	message,
	style,
	...props
}: Readonly<
	Omit<ComponentPropsWithRef<typeof View>, "children"> & { message: string }
>): JSX.Element {
	const { theme } = useUnistyles();

	return (
		<View
			accessibilityLiveRegion="polite"
			{...props}
			style={[styles.row, style]}
		>
			<CircleAlert color={theme.colors.text.destructive.base} size={16} />
			<Text style={styles.message}>{message}</Text>
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	message: {
		...theme.typography.caption,
		color: theme.colors.text.destructive.base,
		flexShrink: 1,
	},
	// Top-aligned rather than centred, so the icon stays beside the message's
	// first line when the message wraps to a second.
	row: {
		alignItems: "flex-start",
		columnGap: theme.gap.xs,
		flexDirection: "row",
	},
}));
