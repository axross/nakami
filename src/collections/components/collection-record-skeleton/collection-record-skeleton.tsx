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

/** how many placeholder rows stand in for the record's fields. */
const PLACEHOLDER_ROWS = [0, 1, 2, 3] as const;

/**
 * a thin placeholder bar's height — a fixed element dimension shared with the
 * other two skeletons in this feature, so the three pulse at one weight.
 */
const BAR_HEIGHT = 11;

/** the placeholder control's height, matching the real controls' `minHeight`. */
const CONTROL_HEIGHT = 48;

/**
 * the record detail loading state: placeholder rows in the same column the
 * loaded fields fill, gently pulsing. each placeholder mirrors a real row's
 * geometry — a label bar, a shorter field-name bar, and a control-height block
 * — so the screen does not reflow when the record arrives. honors the OS
 * "reduce motion" setting (via reanimated's `useReducedMotion`) by holding a
 * steady opacity.
 */
export function CollectionRecordSkeleton({
	style,
	testID = "collection-record-loading",
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

		// the same two tokens the other skeletons in this feature pulse on, so the
		// loading states cannot drift apart.
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
			accessibilityLabel="Loading record"
			testID={testID}
			{...props}
			style={[styles.fields, style]}
		>
			{PLACEHOLDER_ROWS.map((row) => (
				<View key={row} style={styles.row}>
					<Animated.View style={[styles.labelBar, pulse]} />
					<Animated.View style={[styles.nameBar, pulse]} />
					<Animated.View style={[styles.controlBar, pulse]} />
				</View>
			))}
		</View>
	);
}

const styles = StyleSheet.create((theme, rt) => ({
	// stands in for the row's control, at the height every real control opens to.
	controlBar: {
		height: CONTROL_HEIGHT,
		backgroundColor: theme.colors.border.neutral.subtle,
		borderRadius: theme.radius.md,
	},
	// mirrors the loaded screen's own content container, safe-area inset included
	// (see collection-record-screen), so the placeholder does not shift when the
	// record arrives.
	fields: {
		rowGap: theme.gap.lg,
		paddingTop: theme.gap.md,
		paddingBottom: theme.gap.md,
		paddingStart: Math.max(rt.insets.left, theme.gap.md),
		paddingEnd: Math.max(rt.insets.right, theme.gap.md),
	},
	labelBar: {
		width: "34%",
		height: BAR_HEIGHT,
		backgroundColor: theme.colors.border.neutral.subtle,
		borderRadius: theme.radius.sm,
	},
	// shorter than the label bar, the way a field name is shorter than the label
	// derived from it.
	nameBar: {
		width: "22%",
		height: BAR_HEIGHT,
		backgroundColor: theme.colors.border.neutral.subtle,
		borderRadius: theme.radius.sm,
	},
	row: {
		rowGap: theme.gap.xs,
	},
}));
