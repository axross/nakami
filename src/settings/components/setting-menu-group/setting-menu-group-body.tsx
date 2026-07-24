import type { ComponentPropsWithoutRef, JSX } from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export function SettingMenuGroupBody({
	style,
	...props
}: Readonly<ComponentPropsWithoutRef<typeof View>>): JSX.Element {
	return <View style={[styles.body, style]} {...props} />;
}

const styles = StyleSheet.create((theme) => ({
	body: {
		paddingHorizontal: theme.gap.md,
		rowGap: 1,
	},
}));
