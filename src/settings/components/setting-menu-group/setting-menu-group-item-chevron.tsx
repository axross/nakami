import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import type { JSX } from "react";
import { useUnistyles } from "react-native-unistyles";

export function SettingMenuGroupItemChevron(): JSX.Element {
	const { theme } = useUnistyles();

	return (
		<MaterialCommunityIcons
			color={theme.colors.border}
			name="chevron-right"
			size={24}
		/>
	);
}
