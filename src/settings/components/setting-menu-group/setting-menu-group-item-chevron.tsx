import { ChevronRight } from "lucide-react-native";
import type { ComponentProps, JSX } from "react";
import { useUnistyles } from "react-native-unistyles";

export function SettingMenuGroupItemChevron(
	props: Readonly<ComponentProps<typeof ChevronRight>>,
): JSX.Element {
	const { theme } = useUnistyles();

	return (
		<ChevronRight color={theme.colors.text.neutral.base} size={24} {...props} />
	);
}
