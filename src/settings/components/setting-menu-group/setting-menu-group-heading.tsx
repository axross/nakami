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
		color: theme.colors.textPrimary,
		fontSize: theme.fontSizes.md,
		fontWeight: "700",
		paddingHorizontal: theme.gapSizes.x16,
	},
}));
