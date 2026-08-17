import type { ComponentPropsWithRef, JSX } from "react";
import { Pressable, type StyleProp, type ViewStyle } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useSettingMenuGroupContext } from "./setting-menu-group-context";
import {
	getSettingMenuGroupItemChrome,
	getSettingMenuGroupItemPositionVariants,
} from "./setting-menu-group-item-style";

/**
 * an interactive row of a setting menu group. which corners it rounds comes from
 * the position its `<SettingMenuGroupBody>` publishes, never from the caller —
 * moving a row is a change to the JSX order and nothing else.
 *
 * `disabled` is destructured rather than left in the spread because the row both
 * styles on it and still hands it to `Pressable`: a disabled row has to *look*
 * unavailable, not merely stop responding.
 */
export function SettingMenuGroupItem({
	disabled,
	style,
	...props
}: Readonly<
	Omit<ComponentPropsWithRef<typeof Pressable>, "style"> & {
		style?: StyleProp<ViewStyle>;
	}
>): JSX.Element {
	const position = useSettingMenuGroupContext({
		componentName: "SettingMenuGroupItem",
	});

	// `Pressable` types `disabled` as nullable, so the nullish default lands here
	// rather than on the destructured prop.
	styles.useVariants({ position, disabled: disabled ?? false });

	return (
		<Pressable
			disabled={disabled}
			style={({ pressed }) => [
				styles.item,
				pressed ? styles.itemPressed : null,
				style,
			]}
			{...props}
		/>
	);
}

/**
 * this row's stylesheet, exported so its variant selection stays testable. the
 * jest mock for Unistyles strips `variants` and stubs `useVariants`, so a
 * disabled row and an enabled one render identically under test and the fill
 * itself cannot be asserted — the selection is what is left. not a styling API.
 */
export const styles = StyleSheet.create((theme) => ({
	item: {
		...getSettingMenuGroupItemChrome(theme),
		variants: {
			position: getSettingMenuGroupItemPositionVariants(theme),
			// a disabled row moves to a heavier neutral fill rather than dimming: a
			// row is disabled here only while its own action is in flight, and the
			// caller pairs that with a working-state label, so the state has to stay
			// readable instead of fading below it.
			disabled: {
				true: {
					backgroundColor: theme.colors.surface.neutral.base,
				},
				false: {},
				default: {},
			},
		},
	},
	// the press feedback stays its own style rather than a `pressed` variant: the
	// render prop already hands the flag to the array, and a variant would have to
	// be selected from the component body, which cannot see it.
	itemPressed: {
		opacity: 0.7,
	},
}));
