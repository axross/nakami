import { type JSX, useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

// Placeholder name-bar widths per row, so the skeleton reads as varied content
// rather than a repeated block.
const ROW_WIDTHS = [70, 96, 58, 84, 66, 78];

/** Tracks the OS "reduce motion" setting so the pulse can be disabled. */
function useReduceMotion(): boolean {
	const [reduced, setReduced] = useState(false);

	useEffect(() => {
		let active = true;
		AccessibilityInfo.isReduceMotionEnabled().then((value) => {
			if (active) {
				setReduced(value);
			}
		});
		const subscription = AccessibilityInfo.addEventListener(
			"reduceMotionChanged",
			setReduced,
		);
		return () => {
			active = false;
			subscription.remove();
		};
	}, []);

	return reduced;
}

/**
 * The Collections loading state: placeholder rows in the same inset card as the
 * loaded list, gently pulsing. Honors the OS "reduce motion" setting by holding
 * a steady opacity instead of animating.
 */
export function CollectionListSkeleton(): JSX.Element {
	const reduceMotion = useReduceMotion();
	const opacity = useRef(new Animated.Value(0.5)).current;

	useEffect(() => {
		if (reduceMotion) {
			opacity.setValue(0.6);
			return;
		}

		const loop = Animated.loop(
			Animated.sequence([
				Animated.timing(opacity, {
					toValue: 1,
					duration: 700,
					useNativeDriver: true,
				}),
				Animated.timing(opacity, {
					toValue: 0.4,
					duration: 700,
					useNativeDriver: true,
				}),
			]),
		);
		loop.start();
		return () => loop.stop();
	}, [reduceMotion, opacity]);

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
						<Animated.View style={[styles.monogram, { opacity }]} />
						<Animated.View style={[styles.name(width), { opacity }]} />
					</View>
				))}
			</View>
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	card: {
		backgroundColor: theme.colors.backgroundElevated,
		borderColor: theme.colors.border,
		borderRadius: theme.radiusSizes.md,
		borderWidth: 1,
		margin: theme.gapSizes.x16,
		overflow: "hidden",
	},
	monogram: {
		aspectRatio: 1,
		backgroundColor: theme.colors.border,
		borderRadius: theme.radiusSizes.sm,
		width: 34,
	},
	name: (width: number) => ({
		backgroundColor: theme.colors.border,
		borderRadius: theme.radiusSizes.sm,
		height: 11,
		width,
	}),
	root: {
		backgroundColor: theme.colors.background,
		flex: 1,
	},
	row: (divided: boolean) => ({
		alignItems: "center",
		borderTopColor: theme.colors.border,
		borderTopWidth: divided ? 1 : 0,
		columnGap: theme.gapSizes.x12,
		flexDirection: "row",
		minHeight: 56,
		paddingHorizontal: theme.gapSizes.x16,
		paddingVertical: theme.gapSizes.x8,
	}),
}));
