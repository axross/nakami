import type { JSX } from "react";
import { useEffect } from "react";
import { Text, View } from "react-native";
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

const PULSE_DURATION_MS = 700;

/**
 * The live read-out under a collections message state's subtitle: a pulsing dot
 * beside a short line naming what the screen is waiting on. The pulse is what
 * says the wait is ongoing rather than settled, which is how a surface with no
 * action still reads as alive. Honors the OS "reduce motion" setting (via
 * reanimated's `useReducedMotion`) by holding a steady opacity instead, the
 * same way the collections skeletons do.
 */
export function CollectionsMessageStateStatus({
	label,
	testID,
}: Readonly<{ label: string; testID?: string }>): JSX.Element {
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
		<View style={styles.root} testID={testID}>
			<Animated.View style={[styles.dot, pulse]} />
			<Text style={styles.label}>{label}</Text>
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	dot: {
		aspectRatio: 1,
		backgroundColor: theme.colors.text.neutral.base,
		borderRadius: theme.gap.xs,
		width: 8,
	},
	label: {
		...theme.typography.caption,
		color: theme.colors.text.neutral.base,
	},
	root: {
		alignItems: "center",
		columnGap: theme.gap.xs,
		flexDirection: "row",
		marginTop: theme.gap.xs,
	},
}));
