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
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { RECORD_CARD_LINE } from "~/collections/components/collection-record-card/collection-record-card";

// Placeholder title-bar widths per card, so the skeleton reads as varied
// content rather than a repeated block (matching the loaded card feed).
const CARD_WIDTHS: readonly DimensionValue[] = [
	"82%",
	"64%",
	"90%",
	"72%",
	"58%",
];

/**
 * The records loading state: placeholder cards in the same card feed as the
 * loaded list, gently pulsing. Each placeholder card mirrors a real record
 * card's exact geometry — the count header, the inset card padding, and two
 * {@link RECORD_CARD_LINE}-tall line boxes (title + metadata row) — so the list
 * does not reflow when records arrive. Honors the OS "reduce motion" setting
 * (via reanimated's `useReducedMotion`) by holding a steady opacity.
 */
export function CollectionRecordsSkeleton(): JSX.Element {
	const { theme } = useUnistyles();
	const reduceMotion = useReducedMotion();
	const opacity = useSharedValue(0.5);

	useEffect(() => {
		if (reduceMotion) {
			opacity.value = 0.6;
			return;
		}

		// The same two tokens the collections skeleton pulses on, so the two
		// loading states cannot drift apart — which is what a duration constant
		// redeclared per file had already set up.
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
			accessibilityLabel="Loading records"
			style={styles.feed}
			testID="collection-records-loading"
		>
			<View style={styles.count}>
				<Animated.View style={[styles.countBar, pulse]} />
			</View>

			{CARD_WIDTHS.map((width) => (
				<View key={String(width)} style={styles.card}>
					<View style={styles.line}>
						<Animated.View style={[styles.titleBar(width), pulse]} />
					</View>
					<View style={styles.line}>
						<Animated.View style={[styles.metaBar, pulse]} />
					</View>
				</View>
			))}
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	// Mirrors the record card's container (see collection-record-card).
	card: {
		backgroundColor: theme.colors.foundation.neutral.subtle,
		borderColor: theme.colors.border.neutral.subtle,
		borderRadius: theme.radius.md,
		borderWidth: theme.borderWidth.hairline,
		gap: theme.gap.xs,
		paddingHorizontal: theme.gap.md,
		paddingVertical: theme.gap.sm,
	},
	// Mirrors the screen's record-count header.
	count: {
		paddingBottom: theme.gap.xs,
		paddingHorizontal: theme.gap.xs,
	},
	countBar: {
		backgroundColor: theme.colors.border.neutral.subtle,
		borderRadius: theme.radius.sm,
		height: 13,
		width: 72,
	},
	feed: {
		gap: theme.gap.sm,
		padding: theme.gap.md,
	},
	// A card's title and metadata rows are each one fixed line box; the thin bar
	// sits centered inside it, so the placeholder card is exactly as tall as a
	// real one.
	line: {
		height: RECORD_CARD_LINE,
		justifyContent: "center",
	},
	metaBar: {
		backgroundColor: theme.colors.border.neutral.subtle,
		borderRadius: theme.radius.sm,
		height: 11,
		width: "40%",
	},
	titleBar: (width: DimensionValue) => ({
		backgroundColor: theme.colors.border.neutral.subtle,
		borderRadius: theme.radius.sm,
		height: 13,
		width,
	}),
}));
