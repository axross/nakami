import { describe, expect, it } from "@jest/globals";
import { render } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import { themes } from "~/unistyles";
import { LicensesScreen } from "./licenses-screen";

describe("<LicensesScreen>", () => {
	it("renders the placeholder message", () => {
		const { getByTestId, getByText } = render(<LicensesScreen />);

		expect(getByTestId("licenses-screen")).toBeTruthy();
		expect(getByText("License information is not available yet.")).toBeTruthy();
	});

	// A stack header and the tab bar clear this screen's vertical edges, so it
	// owns only the horizontal pair. Unistyles' jest mock reports zero insets, so
	// this is the zero-inset device: the gutter has to survive rather than the
	// edge collapsing to the raw inset.
	it("keeps its horizontal gutter when the runtime reports no insets", () => {
		const { getByTestId } = render(<LicensesScreen />);

		const root = StyleSheet.flatten(getByTestId("licenses-screen").props.style);

		expect(root.paddingStart).toBe(themes.light.gap.lg);
		expect(root.paddingEnd).toBe(themes.light.gap.lg);
	});
});
