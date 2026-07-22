import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import type { ComponentPropsWithoutRef, JSX } from "react";
import { useUnistyles } from "react-native-unistyles";

export function SettingMenuGroupItemIcon({
	...props
}: Readonly<
	Omit<
		ComponentPropsWithoutRef<typeof MaterialCommunityIcons>,
		"color" | "size"
	>
>): JSX.Element {
	const { theme } = useUnistyles();

	return (
		<MaterialCommunityIcons
			color={theme.colors.text.neutral.base}
			size={24}
			{...props}
		/>
	);
}
