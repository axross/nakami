import type { LucideIcon } from "lucide-react-native";
import type { JSX } from "react";
import { useUnistyles } from "react-native-unistyles";

export function SettingMenuGroupItemIcon({
	icon: Icon,
}: Readonly<{ icon: LucideIcon }>): JSX.Element {
	const { theme } = useUnistyles();

	return <Icon color={theme.colors.text.neutral.base} size={24} />;
}
