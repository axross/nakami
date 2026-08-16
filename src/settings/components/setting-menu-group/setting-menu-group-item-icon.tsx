import type { LucideIcon } from "lucide-react-native";
import type { ComponentProps, JSX, RefAttributes } from "react";
import { useUnistyles } from "react-native-unistyles";

/**
 * The ref shape is intersected on by hand because no props helper recovers one
 * here: lucide aliases `LucideIcon` as `ForwardRefExoticComponent<LucideProps>`
 * without the `RefAttributes` its concrete icon exports carry, so
 * `ComponentProps` and `ComponentPropsWithRef` both resolve to a bare
 * `LucideProps`. `SVGSVGElement` is the element type those exports declare —
 * on native as well as on web.
 */
export function SettingMenuGroupItemIcon({
	icon: Icon,
	...props
}: Readonly<
	ComponentProps<LucideIcon> &
		RefAttributes<SVGSVGElement> & { icon: LucideIcon }
>): JSX.Element {
	const { theme } = useUnistyles();

	return <Icon color={theme.colors.text.neutral.base} size={24} {...props} />;
}
