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
import { StyleSheet, useUnistyles } from "react-native-unistyles";

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
		// constant, and on the same two tokens the collections skeletons pulse on
		// — this dot sits beside them in the same screens, so a second copy is how
		// they would drift apart.
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
		<View style={styles.root} testID={testID}>
			<Animated.View style={[styles.dot, pulse]} />
			<Text style={styles.label}>{label}</Text>
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	// `pill` self-clamps to a circle on a square element, so the dot stays round
	// without restating half its width here.
	dot: {
		aspectRatio: 1,
		backgroundColor: theme.colors.text.neutral.base,
		borderRadius: theme.radius.pill,
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
