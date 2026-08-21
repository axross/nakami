import type { ComponentPropsWithRef, JSX } from "react";
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
import { SEARCH_FIELD_HEIGHT } from "~/collections/components/collection-records-header/collection-records-search-field";

// placeholder title-bar widths per card, so the skeleton reads as varied
// content rather than a repeated block (matching the loaded card feed).
const CARD_WIDTHS: readonly DimensionValue[] = [
	"82%",
	"64%",
	"90%",
	"72%",
	"58%",
];

/**
 * the records loading state: the search section and placeholder cards in the
 * same shapes the loaded screen draws, gently pulsing. the section placeholder
 * mirrors the header's expanded geometry — its padding pair, a
 * {@link SEARCH_FIELD_HEIGHT}-tall field, and the count line beneath — and each
 * placeholder card a real record card's: the inset card padding and two
 * {@link RECORD_CARD_LINE}-tall line boxes (title + metadata row). nothing
 * reflows when the records arrive. honors the OS "reduce motion" setting (via
 * reanimated's `useReducedMotion`) by holding a steady opacity.
 */
export function CollectionRecordsSkeleton({
	style,
	testID = "collection-records-loading",
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

		// the same two tokens the collections skeleton pulses on, so the two
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
			testID={testID}
			{...props}
			style={[styles.root, style]}
		>
			<View style={styles.section}>
				<Animated.View style={[styles.fieldBar, pulse]} />
				<View style={styles.count}>
					<Animated.View style={[styles.countBar, pulse]} />
				</View>
			</View>

			<View style={styles.feed}>
				{CARD_WIDTHS.map((width) => (
					<View key={String(width)} style={styles.card}>
						<View style={styles.line}>
							<Animated.View style={[styles.titleBar(width), pulse]} />
						</View>
						<View style={styles.metaLine}>
							<Animated.View style={[styles.idBar, pulse]} />
							<Animated.View style={[styles.metaBar, pulse]} />
						</View>
					</View>
				))}
			</View>
		</View>
	);
}

const styles = StyleSheet.create((theme, rt) => ({
	// mirrors the record card's container (see collection-record-card).
	card: {
		gap: theme.gap.xs,
		paddingVertical: theme.gap.sm,
		paddingHorizontal: theme.gap.md,
		backgroundColor: theme.colors.foundation.neutral.subtle,
		borderColor: theme.colors.border.neutral.subtle,
		borderWidth: theme.borderWidth.hairline,
		borderRadius: theme.radius.md,
	},
	// mirrors the count line inside the search section.
	count: {
		paddingHorizontal: theme.gap.xs,
	},
	countBar: {
		width: 72,
		height: 13,
		backgroundColor: theme.colors.border.neutral.subtle,
		borderRadius: theme.radius.sm,
	},
	// mirrors the loaded feed's content container, safe-area inset included (see
	// collection-records-screen), so the placeholder does not shift when data
	// arrives.
	feed: {
		gap: theme.gap.sm,
		paddingTop: theme.gap.md,
		paddingBottom: theme.gap.md,
		paddingStart: Math.max(rt.insets.left, theme.gap.md),
		paddingEnd: Math.max(rt.insets.right, theme.gap.md),
	},
	// the search field's own placeholder, at the height the real field is fixed
	// to and the radius it takes.
	fieldBar: {
		height: SEARCH_FIELD_HEIGHT,
		backgroundColor: theme.colors.border.neutral.subtle,
		borderRadius: theme.radius.md,
	},
	// the left end of the loaded metadata row: the record's id, which is a line
	// of caption-scale monospace rather than a pill, so its placeholder takes the
	// update label's own bar metrics instead of a pill's height and radius. it
	// stays the wider of the row's two bars, a 24-character id being what arrives
	// there.
	idBar: {
		width: "62%",
		height: 11,
		backgroundColor: theme.colors.border.neutral.subtle,
		borderRadius: theme.radius.sm,
	},
	// a card's title row is one fixed line box; the thin bar sits centered inside
	// it, so the placeholder card is exactly as tall as a real one.
	line: {
		justifyContent: "center",
		height: RECORD_CARD_LINE,
	},
	// the right end of the loaded metadata row: the update label, which is short
	// and never gives way.
	metaBar: {
		width: "20%",
		height: 11,
		backgroundColor: theme.colors.border.neutral.subtle,
		borderRadius: theme.radius.sm,
	},
	// the metadata row's own line box — the same fixed height the title row's
	// carries, laid out like the loaded card's row (see collection-record-card)
	// so its two placeholders sit at the ends the id and the label do.
	metaLine: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		columnGap: theme.gap.xs,
		height: RECORD_CARD_LINE,
	},
	root: {
		flex: 1,
	},
	// mirrors the search section's expanded geometry (see
	// collection-records-header): the same fill, the same edge against the feed,
	// the same padding pair, and the same gap between the field and the count —
	// so the section does not change size when the records arrive.
	section: {
		rowGap: theme.gap.xs,
		paddingTop: theme.gap.sm,
		paddingBottom: theme.gap.sm,
		paddingStart: Math.max(rt.insets.left, theme.gap.md),
		paddingEnd: Math.max(rt.insets.right, theme.gap.md),
		backgroundColor: theme.colors.foundation.neutral.subtle,
		borderBottomColor: theme.colors.border.neutral.subtle,
		borderBottomWidth: theme.borderWidth.hairline,
	},
	titleBar: (width: DimensionValue) => ({
		width,
		height: 13,
		backgroundColor: theme.colors.border.neutral.subtle,
		borderRadius: theme.radius.sm,
	}),
}));
