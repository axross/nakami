import { ChevronRight } from "lucide-react-native";
import type { JSX } from "react";
import { useUnistyles } from "react-native-unistyles";

export function SettingMenuGroupItemChevron(): JSX.Element {
	const { theme } = useUnistyles();

	return <ChevronRight color={theme.colors.border} size={24} />;
}
