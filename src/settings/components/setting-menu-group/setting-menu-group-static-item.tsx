import type { ComponentPropsWithoutRef, JSX } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import {
	type SettingMenuGroupItemPosition,
	useSettingMenuGroupContext,
} from "./setting-menu-group-context";
import { getSettingMenuGroupItemStyle } from "./setting-menu-group-item-style";

/**
 * A row of a setting menu group that presents information rather than a
 * control — the same surface, layout, and position-derived corners as
 * `<SettingMenuGroupItem>`, without a press target or its feedback.
 */
export function SettingMenuGroupStaticItem({
	style,
	...props
}: Readonly<ComponentPropsWithoutRef<typeof View>>): JSX.Element {
	const position = useSettingMenuGroupContext({
		componentName: "SettingMenuGroupStaticItem",
	});

	return <View style={[styles.item(position), style]} {...props} />;
}

const styles = StyleSheet.create((theme) => ({
	// Returns an object literal rather than the helper's result directly, for
	// the reason spelled out in `setting-menu-group-item.tsx`.
	item: (position: SettingMenuGroupItemPosition) => ({
		...getSettingMenuGroupItemStyle(theme, position),
	}),
}));
