import type { ComponentPropsWithRef, JSX } from "react";
import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
	cancelAnimation,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withRepeat,
	withSequence,
	withTiming,
} from "react-native-reanimated";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

// Placeholder name-bar widths per row, so the skeleton reads as varied content
// rather than a repeated block.
const ROW_WIDTHS = [70, 96, 58, 84, 66, 78];

/**
 * The Collections loading state: placeholder rows in the same inset card as the
 * loaded list, gently pulsing. Honors the OS "reduce motion" setting (via
 * reanimated's `useReducedMotion`) by holding a steady opacity instead of
 * animating.
 *
 * The root claims no space of its own: the screen that gives it a whole tab
 * passes `flex: 1` through `style`.
 */
export function CollectionListSkeleton({
	style,
	testID = "collections-loading",
	...props
}: Readonly<
	Omit<ComponentPropsWithRef<typeof View>, "children">
>): JSX.Element {
	const { theme } = useUnistyles();
	const reduceMotion = useReducedMotion();
	const opacity = useSharedValue(0.5);

	useEffect(() => {
		if (reduceMotion) {
			opacity.value = 0.6;
			return;
		}

		// One config for both halves, so the pulse cannot ease in and out on
		// different curves. Read through the theme rather than from a local
		// constant: the records skeleton pulses on these same two tokens, and a
		// second copy is how the two drifted apart in the first place.
		const timing = {
			duration: theme.duration.slow,
			easing: theme.easing.standard,
		};

		opacity.value = withRepeat(
			withSequence(withTiming(1, timing), withTiming(0.4, timing)),
			-1,
			false,
		);

		return () => cancelAnimation(opacity);
	}, [reduceMotion, opacity, theme.duration.slow, theme.easing.standard]);

	const pulse = useAnimatedStyle(() => ({ opacity: opacity.value }));

	return (
		<View
			accessible
			accessibilityLabel="Loading collections"
			testID={testID}
			{...props}
			style={[styles.root, style]}
		>
			{/* Hooked separately from the root: the root carries the accessible
			    label and the caller-overridable hook, while the safe-area inset
			    this card mirrors from the loaded list is what a guard has to be
			    able to read. */}
			<View style={styles.card} testID="collections-loading-card">
				{ROW_WIDTHS.map((width, index) => (
					<View key={width} style={styles.row(index > 0)}>
						<Animated.View style={[styles.monogram, pulse]} />
						<Animated.View style={[styles.name(width), pulse]} />
					</View>
				))}
			</View>
		</View>
	);
}

const styles = StyleSheet.create((theme, rt) => ({
	// Mirrors the loaded list's card, safe-area inset included (see
	// collections-screen), so the placeholder does not shift when data arrives.
	card: {
		backgroundColor: theme.colors.foundation.neutral.subtle,
		borderColor: theme.colors.border.neutral.subtle,
		borderRadius: theme.radius.md,
		borderWidth: theme.borderWidth.hairline,
		marginBottom: theme.gap.md,
		marginEnd: Math.max(rt.insets.right, theme.gap.md),
		marginStart: Math.max(rt.insets.left, theme.gap.md),
		marginTop: theme.gap.md,
		overflow: "hidden",
	},
	monogram: {
		aspectRatio: 1,
		backgroundColor: theme.colors.border.neutral.subtle,
		borderRadius: theme.radius.sm,
		width: 34,
	},
	name: (width: number) => ({
		backgroundColor: theme.colors.border.neutral.subtle,
		borderRadius: theme.radius.sm,
		height: 11,
		width,
	}),
	// Deliberately no fill here: how much room the skeleton gets is the
	// consumer's half of the split, so do not "fix" this by adding one.
	root: {
		backgroundColor: theme.colors.foundation.neutral.bare,
	},
	row: (divided: boolean) => ({
		alignItems: "center",
		borderTopColor: theme.colors.border.neutral.subtle,
		borderTopWidth: divided ? theme.borderWidth.hairline : 0,
		columnGap: theme.gap.sm,
		flexDirection: "row",
		minHeight: 56,
		paddingHorizontal: theme.gap.md,
		paddingVertical: theme.gap.xs,
	}),
}));
