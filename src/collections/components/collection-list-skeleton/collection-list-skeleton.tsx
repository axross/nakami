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

// placeholder name-bar widths per card, so the skeleton reads as varied content
// rather than a repeated block.
const CARD_WIDTHS = [70, 96, 58, 84, 66, 78];

/**
 * the Collections loading state: placeholder cards in the same feed as the
 * loaded list, gently pulsing. honors the OS "reduce motion" setting (via
 * reanimated's `useReducedMotion`) by holding a steady opacity instead of
 * animating.
 *
 * the root claims no space of its own: the screen that gives it a whole tab
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

		// one config for both halves, so the pulse cannot ease in and out on
		// different curves. read through the theme rather than from a local
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
			style={[styles.feed, style]}
		>
			{/* deliberately unhooked, as the records skeleton's placeholders are:
			    this project's e2e runner matches an identifier flatly across the
			    whole screen, so one hook repeated across six siblings would not
			    be the globally unique hook it needs. a test reaches a card by its
			    shape instead — see `subtreeStyles`. */}
			{CARD_WIDTHS.map((width) => (
				<View key={width} style={styles.card}>
					<Animated.View style={[styles.mark, pulse]} />
					<Animated.View style={[styles.name(width), pulse]} />
				</View>
			))}
		</View>
	);
}

const styles = StyleSheet.create((theme, rt) => ({
	// mirrors the loaded item's own card (see collection-list-item), down to the
	// touch-target minimum, so a placeholder is exactly as tall as the card it
	// stands in for.
	card: {
		flexDirection: "row",
		alignItems: "center",
		columnGap: theme.gap.sm,
		minHeight: 56,
		paddingVertical: theme.gap.sm,
		paddingHorizontal: theme.gap.md,
		backgroundColor: theme.colors.foundation.neutral.subtle,
		borderColor: theme.colors.border.neutral.subtle,
		borderWidth: theme.borderWidth.hairline,
		borderRadius: theme.radius.md,
	},
	// mirrors the loaded list's content container, safe-area inset included (see
	// collections-screen), so the placeholder does not shift when data arrives.
	// the ground is this component's own rather than part of that mirror: it
	// stands in for a whole tab, and the loaded list's own container paints
	// nothing. deliberately no fill here, though: how much room the skeleton
	// gets is the consumer's half of the split, so do not "fix" this by adding
	// one.
	feed: {
		gap: theme.gap.sm,
		paddingTop: theme.gap.md,
		paddingBottom: theme.gap.md,
		paddingStart: Math.max(rt.insets.left, theme.gap.md),
		paddingEnd: Math.max(rt.insets.right, theme.gap.md),
		backgroundColor: theme.colors.foundation.neutral.bare,
	},
	mark: {
		width: 34,
		aspectRatio: 1,
		backgroundColor: theme.colors.border.neutral.subtle,
		borderRadius: theme.radius.sm,
	},
	name: (width: number) => ({
		width,
		height: 11,
		backgroundColor: theme.colors.border.neutral.subtle,
		borderRadius: theme.radius.sm,
	}),
}));
