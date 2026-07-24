import type { JSX } from "react";
import { useEffect } from "react";
import { type DimensionValue, View } from "react-native";
import Animated, {
	cancelAnimation,
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withRepeat,
	withSequence,
	withTiming,
} from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";

// Placeholder title-bar widths per card, so the skeleton reads as varied
// content rather than a repeated block (matching the loaded card feed).
const CARD_WIDTHS: readonly DimensionValue[] = [
	"82%",
	"64%",
	"90%",
	"72%",
	"58%",
];

const PULSE_DURATION_MS = 700;

/**
 * The records loading state: placeholder cards in the same feed layout as the
 * loaded list, gently pulsing. Honors the OS "reduce motion" setting (via
 * reanimated's `useReducedMotion`) by holding a steady opacity instead of
 * animating — mirroring the collection-list skeleton.
 */
export function CollectionRecordsSkeleton(): JSX.Element {
	const reduceMotion = useReducedMotion();
	const opacity = useSharedValue(0.5);

	useEffect(() => {
		if (reduceMotion) {
			opacity.value = 0.6;
			return;
		}

		opacity.value = withRepeat(
			withSequence(
				withTiming(1, { duration: PULSE_DURATION_MS }),
				withTiming(0.4, { duration: PULSE_DURATION_MS }),
			),
			-1,
			false,
		);

		return () => cancelAnimation(opacity);
	}, [reduceMotion, opacity]);

	const pulse = useAnimatedStyle(() => ({ opacity: opacity.value }));

	return (
		<View
			accessible
			accessibilityLabel="Loading records"
			style={styles.feed}
			testID="collection-records-loading"
		>
			{CARD_WIDTHS.map((width) => (
				<View key={String(width)} style={styles.card}>
					<Animated.View style={[styles.title(width), pulse]} />
					<Animated.View style={[styles.meta, pulse]} />
				</View>
			))}
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	card: {
		backgroundColor: theme.colors.foundation.neutral.subtle,
		borderColor: theme.colors.border.neutral.subtle,
		borderRadius: theme.gap.sm,
		borderWidth: 1,
		gap: theme.gap.xs,
		paddingHorizontal: theme.gap.md,
		paddingVertical: theme.gap.sm,
	},
	feed: {
		gap: theme.gap.sm,
		padding: theme.gap.md,
	},
	meta: {
		backgroundColor: theme.colors.border.neutral.subtle,
		borderRadius: theme.gap.xs,
		height: 10,
		width: "40%",
	},
	title: (width: DimensionValue) => ({
		backgroundColor: theme.colors.border.neutral.subtle,
		borderRadius: theme.gap.xs,
		height: 13,
		width,
	}),
}));
