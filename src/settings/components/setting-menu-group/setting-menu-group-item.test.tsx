import { describe, expect, it } from "@jest/globals";
import { render } from "@testing-library/react-native";
import { View } from "react-native";
import { SettingMenuGroupBody } from "./setting-menu-group-body";
import { SettingMenuGroupItem } from "./setting-menu-group-item";

// theme.gap.sm — the radius every rounded group corner uses.
const radius = 12;

describe("<SettingMenuGroupItem>", () => {
	it("rounds every corner when it is the group's only row", () => {
		const { getByTestId } = render(
			<SettingMenuGroupBody>
				<SettingMenuGroupItem testID="only" />
			</SettingMenuGroupBody>,
		);

		expect(getByTestId("only")).toHaveStyle({
			borderTopLeftRadius: radius,
			borderTopRightRadius: radius,
			borderBottomLeftRadius: radius,
			borderBottomRightRadius: radius,
		});
	});

	it("rounds the top corners of the first row, none of a middle row, and the bottom corners of the last row", () => {
		const { getByTestId } = render(
			<SettingMenuGroupBody>
				<SettingMenuGroupItem testID="first" />
				<SettingMenuGroupItem testID="middle" />
				<SettingMenuGroupItem testID="last" />
			</SettingMenuGroupBody>,
		);

		expect(getByTestId("first")).toHaveStyle({
			borderTopLeftRadius: radius,
			borderTopRightRadius: radius,
			borderBottomLeftRadius: 0,
			borderBottomRightRadius: 0,
		});
		expect(getByTestId("middle")).toHaveStyle({
			borderTopLeftRadius: 0,
			borderTopRightRadius: 0,
			borderBottomLeftRadius: 0,
			borderBottomRightRadius: 0,
		});
		expect(getByTestId("last")).toHaveStyle({
			borderTopLeftRadius: 0,
			borderTopRightRadius: 0,
			borderBottomLeftRadius: radius,
			borderBottomRightRadius: radius,
		});
	});

	it("positions a row nested inside a wrapper element, as a router link wraps one", () => {
		const { getByTestId } = render(
			<SettingMenuGroupBody>
				<SettingMenuGroupItem testID="first" />
				<View>
					<SettingMenuGroupItem testID="wrapped" />
				</View>
			</SettingMenuGroupBody>,
		);

		expect(getByTestId("wrapped")).toHaveStyle({
			borderBottomLeftRadius: radius,
			borderBottomRightRadius: radius,
		});
	});

	it("throws a named error when rendered outside a group body", () => {
		expect(() => render(<SettingMenuGroupItem />)).toThrow(
			"<SettingMenuGroupItem> must be used within a <SettingMenuGroupBody> component.",
		);
	});
});
