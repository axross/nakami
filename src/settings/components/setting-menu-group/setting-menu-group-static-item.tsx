import type { ComponentPropsWithRef, JSX } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useSettingMenuGroupContext } from "./setting-menu-group-context";
import {
	getSettingMenuGroupItemChrome,
	getSettingMenuGroupItemPositionVariants,
} from "./setting-menu-group-item-style";

/**
 * A row that presents information rather than a control — the same surface,
 * layout, and position-derived corners as `<SettingMenuGroupItem>`, with no press
 * target, no press feedback, and no interactive role for assistive technology to
 * announce.
 */
export function SettingMenuGroupStaticItem({
	style,
	...props
}: Readonly<ComponentPropsWithRef<typeof View>>): JSX.Element {
	const position = useSettingMenuGroupContext({
		componentName: "SettingMenuGroupStaticItem",
	});

	styles.useVariants({ position });

	return <View style={[styles.item, style]} {...props} />;
}

const styles = StyleSheet.create((theme) => ({
	item: {
		...getSettingMenuGroupItemChrome(theme),
		variants: {
			position: getSettingMenuGroupItemPositionVariants(theme),
		},
	},
}));
