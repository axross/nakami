import { describe, expect, it } from "@jest/globals";
import { render } from "@testing-library/react-native";
import { LicensesScreen } from "./licenses-screen";

describe("<LicensesScreen>", () => {
	it("renders the placeholder message", () => {
		const { getByTestId, getByText } = render(<LicensesScreen />);

		expect(getByTestId("licenses-screen")).toBeTruthy();
		expect(getByText("License information is not available yet.")).toBeTruthy();
	});
});
