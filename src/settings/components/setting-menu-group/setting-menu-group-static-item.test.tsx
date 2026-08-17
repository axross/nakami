import { describe, expect, it, jest } from "@jest/globals";
import { render } from "@testing-library/react-native";
import { SettingMenuGroupStaticItem } from "./setting-menu-group-static-item";

describe("<SettingMenuGroupStaticItem>", () => {
	// The static row reads the same context as the interactive one, so it owes the
	// same immediate, named failure rather than a plain `View`'s silent success.
	it("throws an error naming itself and its required parent when rendered outside a body", () => {
		const reportedByReact = jest
			.spyOn(console, "error")
			.mockImplementation(() => {});

		try {
			expect(() => render(<SettingMenuGroupStaticItem />)).toThrow(
				"<SettingMenuGroupStaticItem> must be used within a <SettingMenuGroupBody> component.",
			);
		} finally {
			reportedByReact.mockRestore();
		}
	});
});
