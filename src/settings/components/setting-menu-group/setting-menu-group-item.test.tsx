import { describe, expect, it, jest } from "@jest/globals";
import { render } from "@testing-library/react-native";
import { SettingMenuGroupItem } from "./setting-menu-group-item";

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
});
