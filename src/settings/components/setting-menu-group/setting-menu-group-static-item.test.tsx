import { describe, expect, it } from "@jest/globals";
import { render } from "@testing-library/react-native";
import { SettingMenuGroupBody } from "./setting-menu-group-body";
import { SettingMenuGroupItem } from "./setting-menu-group-item";
import { SettingMenuGroupStaticItem } from "./setting-menu-group-static-item";

// theme.gap.sm — the radius every rounded group corner uses.
const radius = 12;

describe("<SettingMenuGroupStaticItem>", () => {
	it("rounds the same corners as an interactive row in the same position", () => {
		const { getByTestId } = render(
			<SettingMenuGroupBody>
				<SettingMenuGroupStaticItem testID="static" />
				<SettingMenuGroupItem testID="interactive" />
			</SettingMenuGroupBody>,
		);

		expect(getByTestId("static")).toHaveStyle({
			borderTopLeftRadius: radius,
			borderTopRightRadius: radius,
			borderBottomLeftRadius: 0,
			borderBottomRightRadius: 0,
		});
		expect(getByTestId("interactive")).toHaveStyle({
			borderTopLeftRadius: 0,
			borderTopRightRadius: 0,
			borderBottomLeftRadius: radius,
			borderBottomRightRadius: radius,
		});
	});

	it("throws a named error when rendered outside a group body", () => {
		expect(() => render(<SettingMenuGroupStaticItem />)).toThrow(
			"<SettingMenuGroupStaticItem> must be used within a <SettingMenuGroupBody> component.",
		);
	});
});
