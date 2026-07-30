import type { ComponentPropsWithoutRef, JSX } from "react";
import { Text } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export function SettingMenuGroupHeading({
	style,
	...props
}: Readonly<ComponentPropsWithoutRef<typeof Text>>): JSX.Element {
	return <Text style={[styles.heading, style]} {...props} />;
}

const styles = StyleSheet.create((theme) => ({
	heading: {
		...theme.text.heading,
		color: theme.colors.text.neutral.intense,
		paddingHorizontal: theme.gap.md,
	},
}));
