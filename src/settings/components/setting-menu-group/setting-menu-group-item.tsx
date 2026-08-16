import type { ComponentPropsWithRef, JSX } from "react";
import { Pressable, type StyleProp, type ViewStyle } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export function SettingMenuGroupItem({
	first = false,
	last = false,
	style,
	...props
}: Readonly<
	Omit<ComponentPropsWithRef<typeof Pressable>, "style"> & {
		first?: boolean;
		last?: boolean;
		style?: StyleProp<ViewStyle>;
	}
>): JSX.Element {
	return (
		<Pressable
			style={({ pressed }) => [styles.item(first, last, pressed), style]}
			{...props}
		/>
	);
}

const styles = StyleSheet.create((theme) => ({
	item: (first: boolean, last: boolean, pressed: boolean) => ({
		flexDirection: "row",
		alignItems: "center",
		columnGap: theme.gap.md,
		minHeight: 48,
		paddingVertical: theme.gap.xs,
		paddingHorizontal: theme.gap.md,
		backgroundColor: theme.colors.foundation.neutral.subtle,
		borderTopLeftRadius: first ? theme.radius.md : 0,
		borderTopRightRadius: first ? theme.radius.md : 0,
		borderBottomLeftRadius: last ? theme.radius.md : 0,
		borderBottomRightRadius: last ? theme.radius.md : 0,
		opacity: pressed ? 0.7 : 1,
	}),
}));
