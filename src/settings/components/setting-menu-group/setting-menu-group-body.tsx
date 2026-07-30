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
		// The group's rows sit flush against each other; the gap between them is
		// the separator, so it is a border width rather than scale spacing.
		rowGap: theme.borderWidth.hairline,
	},
}));
