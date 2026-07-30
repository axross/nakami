import type { ComponentPropsWithoutRef, JSX } from "react";
import { Pressable, type StyleProp, type ViewStyle } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import {
	type SettingMenuGroupItemPosition,
	useSettingMenuGroupContext,
} from "./setting-menu-group-context";
import { getSettingMenuGroupItemStyle } from "./setting-menu-group-item-style";

/**
 * An interactive row of a setting menu group. Which corners it rounds comes
 * from the position its `<SettingMenuGroupBody>` publishes, not from the caller.
 */
export function SettingMenuGroupItem({
	style,
	...props
}: Readonly<
	Omit<ComponentPropsWithoutRef<typeof Pressable>, "style"> & {
		style?: StyleProp<ViewStyle>;
	}
>): JSX.Element {
	const position = useSettingMenuGroupContext({
		componentName: "SettingMenuGroupItem",
	});

	return (
		<Pressable
			style={({ pressed }) => [
				styles.item(position),
				pressed ? styles.itemPressed : null,
				style,
			]}
			{...props}
		/>
	);
}

const styles = StyleSheet.create((theme) => ({
	// The dynamic function must return an object literal: Unistyles' Babel
	// plugin records a style's theme dependency by writing into the literal it
	// returns, and silently records nothing — leaving the style frozen at the
	// theme that was current when it was first computed — when the body is a
	// bare call instead.
	item: (position: SettingMenuGroupItemPosition) => ({
		...getSettingMenuGroupItemStyle(theme, position),
	}),
	itemPressed: {
		opacity: 0.7,
	},
}));
