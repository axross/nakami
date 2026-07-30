import type { LucideIcon } from "lucide-react-native";
import type { ComponentProps, JSX } from "react";
import { useUnistyles } from "react-native-unistyles";

export function SettingMenuGroupItemIcon({
	icon: Icon,
	...props
}: Readonly<ComponentProps<LucideIcon> & { icon: LucideIcon }>): JSX.Element {
	const { theme } = useUnistyles();

	return <Icon color={theme.colors.text.neutral.base} size={24} {...props} />;
}
