import type { JSX } from "react";
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
 */
export function CollectionListSkeleton(): JSX.Element {
	const { theme } = useUnistyles();
	const reduceMotion = useReducedMotion();
	const opacity = useSharedValue(0.5);

	useEffect(() => {
		if (reduceMotion) {
			opacity.value = 0.6;
			return;
		}

		const pulseStep = {
			duration: theme.duration.slow,
			easing: theme.easing.standard,
		};

		opacity.value = withRepeat(
			withSequence(withTiming(1, pulseStep), withTiming(0.4, pulseStep)),
			-1,
			false,
		);

		return () => cancelAnimation(opacity);
	}, [reduceMotion, opacity, theme.duration.slow, theme.easing.standard]);

	const pulse = useAnimatedStyle(() => ({ opacity: opacity.value }));

	return (
		<View style={styles.root}>
			<View
				accessible
				accessibilityLabel="Loading collections"
				style={styles.card}
				testID="collections-loading"
			>
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

const styles = StyleSheet.create((theme) => ({
	card: {
		backgroundColor: theme.colors.foundation.neutral.subtle,
		borderColor: theme.colors.border.neutral.subtle,
		borderRadius: theme.radius.md,
		borderWidth: theme.borderWidth.hairline,
		margin: theme.gap.md,
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
	root: {
		backgroundColor: theme.colors.foundation.neutral.bare,
		flex: 1,
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
