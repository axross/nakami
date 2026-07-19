import type { ComponentPropsWithoutRef, JSX } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export function SettingMenuGroup({
	style,
	...props
}: Readonly<ComponentPropsWithoutRef<typeof View>>): JSX.Element {
	return <View style={[styles.group, style]} {...props} />;
}

const styles = StyleSheet.create((theme) => ({
	group: {
		rowGap: theme.gapSizes.x12,
	},
}));
