import { describe, expect, it } from "@jest/globals";
import { render } from "@testing-library/react-native";
import type { LucideIcon } from "lucide-react-native";
import { View } from "react-native";
import { SettingMenuGroupItemIcon } from "./setting-menu-group-item-icon";

/**
 * stands in for the caller's Lucide icon. the suite maps `lucide-react-native`
 * to a stub that renders an empty fragment and drops every prop it is given
 * (see `jest/lucide-react-native-mock.js`), so a real icon can never show what
 * reached it — a dropped rest object would leave the whole suite green. this
 * records the props it receives on a host node instead.
 */
const ProbeIcon = ((props: Readonly<Record<string, unknown>>) => (
	<View {...props} />
)) as unknown as LucideIcon;

describe("<SettingMenuGroupItemIcon>", () => {
	// the part's only visible job is placing an icon, which is exactly the case
	// the composition rules name as still owing its caller a props spread.
	it("forwards an undeclared prop to the icon it renders", () => {
		const { getByTestId } = render(
			<SettingMenuGroupItemIcon
				accessibilityLabel="Appearance"
				icon={ProbeIcon}
				testID="probe-icon"
			/>,
		);

		expect(getByTestId("probe-icon").props.accessibilityLabel).toBe(
			"Appearance",
		);
	});

	// colour and size are set before the spread, so the menu's own look is the
	// default rather than a value a caller cannot get past.
	it("defaults the icon's colour and size, and lets a caller override them", () => {
		const { getByTestId } = render(
			<SettingMenuGroupItemIcon icon={ProbeIcon} testID="probe-icon" />,
		);
		const { getByTestId: getOverridden } = render(
			<SettingMenuGroupItemIcon
				icon={ProbeIcon}
				size={16}
				testID="overridden-icon"
			/>,
		);

		expect(getByTestId("probe-icon").props.size).toBe(24);
		expect(typeof getByTestId("probe-icon").props.color).toBe("string");
		expect(getOverridden("overridden-icon").props.size).toBe(16);
	});
});
