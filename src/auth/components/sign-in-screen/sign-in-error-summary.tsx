import { ChevronRight, type LucideIcon } from "lucide-react-native";
import type { ComponentPropsWithRef, JSX } from "react";
import { Pressable, Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

/**
 * The form's filled destructive banner, used for both errors that belong to the
 * form rather than to one field: the count of validation problems after a press
 * of Sign in, and the server's own rejection.
 *
 * Passing `onPress` is what makes it a control — it then carries a chevron and
 * the button role, which is how the count links to the first offending field.
 * The server-error slot passes none and stays a plain surface, because there is
 * nowhere for it to send the user.
 *
 * `accessibilityLiveRegion` announces the banner on Android; being Android-only
 * in React Native, the screen pairs it with an `AccessibilityInfo` announcement
 * on iOS.
 */
export function SignInErrorSummary({
	icon: Icon,
	message,
	onPress,
	style,
	...props
}: Readonly<
	Omit<ComponentPropsWithRef<typeof View>, "children"> & {
		icon: LucideIcon;
		message: string;
		onPress?: () => void;
	}
>): JSX.Element {
	const { theme } = useUnistyles();

	const content = (
		<>
			<Icon color={theme.colors.text.destructive.base} size={16} />
			<Text style={styles.message}>{message}</Text>
			{onPress === undefined ? null : (
				<ChevronRight color={theme.colors.text.destructive.base} size={16} />
			)}
		</>
	);

	if (onPress === undefined) {
		return (
			<View
				accessibilityLiveRegion="polite"
				{...props}
				style={[styles.banner, style]}
			>
				{content}
			</View>
		);
	}

	return (
		<Pressable
			accessibilityLiveRegion="polite"
			accessibilityRole="button"
			onPress={onPress}
			{...props}
			style={({ pressed }) => [
				styles.banner,
				pressed && styles.bannerPressed,
				style,
			]}
		>
			{content}
		</Pressable>
	);
}

const styles = StyleSheet.create((theme) => ({
	// `minHeight` is the touch target rather than a look: the caption line box
	// plus this padding falls short of the 44pt minimum a control needs, and the
	// banner is a control whenever it carries an `onPress`.
	banner: {
		alignItems: "center",
		backgroundColor: theme.colors.surface.destructive.base,
		borderColor: theme.colors.border.destructive.subtle,
		borderRadius: theme.radius.md,
		borderWidth: theme.borderWidth.hairline,
		columnGap: theme.gap.xs,
		flexDirection: "row",
		minHeight: 44,
		paddingHorizontal: theme.gap.sm,
		paddingVertical: theme.gap.xs,
	},
	bannerPressed: {
		opacity: 0.6,
	},
	message: {
		...theme.typography.caption,
		color: theme.colors.text.destructive.base,
		flexGrow: 1,
		flexShrink: 1,
	},
}));
