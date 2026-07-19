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
		paddingHorizontal: theme.gapSizes.x16,
		rowGap: 1,
	},
}));
