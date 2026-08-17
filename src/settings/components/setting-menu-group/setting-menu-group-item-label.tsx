import type { ComponentPropsWithRef, JSX } from "react";
import { Text } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export function SettingMenuGroupItemLabel({
	style,
	...props
}: Readonly<ComponentPropsWithRef<typeof Text>>): JSX.Element {
	return <Text style={[styles.label, style]} {...props} />;
}

const styles = StyleSheet.create((theme) => ({
	label: {
		...theme.typography.body,
		flexGrow: 1,
		flexShrink: 1,
		color: theme.colors.text.neutral.intense,
	},
}));
