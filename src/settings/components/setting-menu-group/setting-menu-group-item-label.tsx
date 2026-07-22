import type { ComponentPropsWithoutRef, JSX } from "react";
import { Text } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export function SettingMenuGroupItemLabel({
	style,
	...props
}: Readonly<ComponentPropsWithoutRef<typeof Text>>): JSX.Element {
	return <Text style={[styles.label, style]} {...props} />;
}

const styles = StyleSheet.create((theme) => ({
	label: {
		color: theme.colors.text.neutral.intense,
		flexGrow: 1,
		flexShrink: 1,
		fontFamily: theme.fonts.paragraph,
		fontSize: 16,
	},
}));
