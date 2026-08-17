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
 */
export function SettingMenuGroupItem({
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

	styles.useVariants({ position });

	return (
		<Pressable
			style={({ pressed }) => [
				styles.item,
				pressed ? styles.itemPressed : null,
				style,
			]}
			{...props}
		/>
	);
}

const styles = StyleSheet.create((theme) => ({
	item: {
		...getSettingMenuGroupItemChrome(theme),
		variants: {
			position: getSettingMenuGroupItemPositionVariants(theme),
		},
	},
	// the press feedback stays its own style rather than a `pressed` variant: the
	// render prop already hands the flag to the array, and a variant would have to
	// be selected from the component body, which cannot see it.
	itemPressed: {
		opacity: 0.7,
	},
}));
