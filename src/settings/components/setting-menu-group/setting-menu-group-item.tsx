import type { ComponentPropsWithRef, JSX } from "react";
import { Pressable, type StyleProp, type ViewStyle } from "react-native";
import { StyleSheet } from "react-native-unistyles";

/**
 * a row of a settings menu group. `disabled` is destructured rather than left
 * in the spread because the row both styles on it and still hands it to
 * `Pressable`: a disabled row has to *look* unavailable, not merely stop
 * responding.
 */
export function SettingMenuGroupItem({
	first = false,
	last = false,
	disabled,
	style,
	...props
}: Readonly<
	Omit<ComponentPropsWithRef<typeof Pressable>, "style"> & {
		first?: boolean;
		last?: boolean;
		style?: StyleProp<ViewStyle>;
	}
>): JSX.Element {
	return (
		<Pressable
			disabled={disabled}
			style={({ pressed }) => [
				// `Pressable` types `disabled` as nullable, so the nullish default
				// lands here rather than on the destructured prop.
				styles.item(first, last, pressed, disabled ?? false),
				style,
			]}
			{...props}
		/>
	);
}

const styles = StyleSheet.create((theme) => ({
	// the disabled row moves to a heavier neutral fill rather than dimming: a
	// row is disabled here only while its own action is in flight, and the
	// caller pairs that with a working-state label, so the state has to stay
	// readable instead of fading below it.
	item: (
		first: boolean,
		last: boolean,
		pressed: boolean,
		disabled: boolean,
	) => ({
		alignItems: "center",
		backgroundColor: disabled
			? theme.colors.surface.neutral.base
			: theme.colors.foundation.neutral.subtle,
		borderBottomLeftRadius: last ? theme.radius.md : 0,
		borderBottomRightRadius: last ? theme.radius.md : 0,
		borderTopLeftRadius: first ? theme.radius.md : 0,
		borderTopRightRadius: first ? theme.radius.md : 0,
		columnGap: theme.gap.md,
		flexDirection: "row",
		minHeight: 48,
		opacity: pressed ? 0.7 : 1,
		paddingHorizontal: theme.gap.md,
		paddingVertical: theme.gap.xs,
	}),
}));
