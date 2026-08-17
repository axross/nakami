import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";
import { SettingMenuGroupBody } from "./setting-menu-group-body";
import { SettingMenuGroupItem, styles } from "./setting-menu-group-item";

describe("<SettingMenuGroupItem>", () => {
	// a row copied into another tree used to render with silently square corners.
	// it now fails at the point of the mistake, naming the part and the parent it
	// needs. React also reports the throw through `console.error`, which is noise
	// here rather than a second failure.
	it("throws an error naming itself and its required parent when rendered outside a body", () => {
		const reportedByReact = jest
			.spyOn(console, "error")
			.mockImplementation(() => {});

		try {
			expect(() => render(<SettingMenuGroupItem />)).toThrow(
				"<SettingMenuGroupItem> must be used within a <SettingMenuGroupBody> component.",
			);
		} finally {
			reportedByReact.mockRestore();
		}
	});
	// the disabled fill is a Unistyles variant, and the jest mock strips every
	// variant from the stylesheet — so the heavier neutral surface never reaches
	// the rendered tree here and cannot be asserted. the selection can: delete the
	// `disabled` group, or stop passing the flag, and this goes red.
	it("selects the disabled variant while the row is disabled", () => {
		const useVariants = jest.spyOn(styles, "useVariants");

		try {
			render(
				<SettingMenuGroupBody>
					<SettingMenuGroupItem disabled />
				</SettingMenuGroupBody>,
			);

			expect(useVariants).toHaveBeenCalledWith({
				position: "only",
				disabled: true,
			});
		} finally {
			useVariants.mockRestore();
		}
	});

	it("selects the enabled variant while it is not", () => {
		const useVariants = jest.spyOn(styles, "useVariants");

		try {
			render(
				<SettingMenuGroupBody>
					<SettingMenuGroupItem />
				</SettingMenuGroupBody>,
			);

			// `false` is passed explicitly: to Unistyles that is not the same as
			// leaving the group unselected.
			expect(useVariants).toHaveBeenCalledWith({
				position: "only",
				disabled: false,
			});
		} finally {
			useVariants.mockRestore();
		}
	});
	// the disabled fill is only half of it: the row also has to stop responding,
	// which is what `disabled` reaching `Pressable` does. `accessibilityState`
	// comes from the caller and would keep saying "disabled" either way.
	it("does not fire onPress while disabled", () => {
		const onPress = jest.fn();

		const { getByTestId } = render(
			<SettingMenuGroupBody>
				<SettingMenuGroupItem disabled onPress={onPress} testID="row" />
			</SettingMenuGroupBody>,
		);

		fireEvent.press(getByTestId("row"));

		expect(onPress).not.toHaveBeenCalled();
	});
});
