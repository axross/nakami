import { CircleAlert } from "lucide-react-native";
import type { ComponentPropsWithRef, JSX } from "react";
import { Platform, Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

/**
 * a single field's validation message, rendered directly beneath the input it
 * concerns. the icon is the non-colour cue: the message has to be legible as an
 * error to a reader who cannot tell the destructive text tone from the neutral
 * one around it.
 *
 * `accessibilityLiveRegion` announces the message on Android. it is Android-only
 * in React Native, so the screen pairs it with an `AccessibilityInfo`
 * announcement on iOS — neither platform is left silent, and neither
 * double-announces.
 *
 * on iOS this surface is hidden from the accessibility tree, because the
 * message reaches VoiceOver twice otherwise: `signInFieldLabel` has already
 * folded it into the input's own name, and this row sits immediately after that
 * input. `aria-describedby`'s node on the web is referenced rather than also
 * traversed; the substitute this repository uses in its place has no such
 * exemption, so it is applied here. Android keeps the element, because the live
 * region above is its only channel.
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
			accessibilityElementsHidden={Platform.OS === "ios"}
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
	// top-aligned rather than centred, so the icon stays beside the message's
	// first line when the message wraps to a second.
	row: {
		alignItems: "flex-start",
		columnGap: theme.gap.xs,
		flexDirection: "row",
	},
}));
