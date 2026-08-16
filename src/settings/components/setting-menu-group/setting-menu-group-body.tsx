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
	// The rows sit flush and are separated by the gap between them rather than by
	// a border, so this `rowGap` is a hairline rather than a spacing step — the
	// group's ground shows through it as the separator.
	body: {
		paddingHorizontal: theme.gap.md,
		rowGap: theme.borderWidth.hairline,
	},
}));
