import { describe, expect, it } from "@jest/globals";
import { render } from "@testing-library/react-native";
import { CollectionsScreen } from "./collections-screen";

describe("<CollectionsScreen>", () => {
	it("renders the empty state", () => {
		const { getByTestId, getByText } = render(<CollectionsScreen />);

		expect(getByTestId("collections-screen")).toBeTruthy();
		expect(getByText("No collections yet.")).toBeTruthy();
	});
});
