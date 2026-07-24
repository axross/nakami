import type { ComponentPropsWithoutRef, JSX } from "react";
import { Pressable, type StyleProp, type ViewStyle } from "react-native";
import { StyleSheet } from "react-native-unistyles";

export function SettingMenuGroupItem({
	first = false,
	last = false,
	style,
	...props
}: Readonly<
	Omit<ComponentPropsWithoutRef<typeof Pressable>, "style"> & {
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
		alignItems: "center",
		backgroundColor: theme.colors.foundation.neutral.subtle,
		borderBottomLeftRadius: last ? theme.gap.sm : 0,
		borderBottomRightRadius: last ? theme.gap.sm : 0,
		borderTopLeftRadius: first ? theme.gap.sm : 0,
		borderTopRightRadius: first ? theme.gap.sm : 0,
		columnGap: theme.gap.md,
		flexDirection: "row",
		minHeight: 48,
		opacity: pressed ? 0.7 : 1,
		paddingHorizontal: theme.gap.md,
		paddingVertical: theme.gap.xs,
	}),
}));
