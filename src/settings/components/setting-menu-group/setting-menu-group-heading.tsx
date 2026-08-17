import type { ComponentPropsWithRef, JSX } from "react";
import { Text } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export function SettingMenuGroupHeading({
	style,
	...props
}: Readonly<ComponentPropsWithRef<typeof Text>>): JSX.Element {
	return <Text style={[styles.heading, style]} {...props} />;
}

const styles = StyleSheet.create((theme) => ({
	heading: {
		...theme.typography.heading,
		paddingHorizontal: theme.gap.md,
		color: theme.colors.text.neutral.intense,
	},
}));
