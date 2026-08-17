import { describe, expect, it } from "@jest/globals";
import { renderRouter } from "expo-router/testing-library";
import { StyleSheet } from "react-native";
import { themes } from "~/unistyles";
import { HomeScreen } from "./home-screen";

describe("<HomeScreen>", () => {
	it("renders the app placeholder", () => {
		const { getByTestId, getByText } = renderRouter(
			{ index: HomeScreen },
			{ initialUrl: "/" },
		);

		expect(getByTestId("home-screen")).toBeTruthy();
		expect(getByText("Nakami")).toBeTruthy();
		expect(getByText("A companion mobile app for Payload CMS.")).toBeTruthy();
	});

	// the tab group hides its header, so this screen owns the top edge and the
	// horizontal pair. Unistyles' jest mock reports zero insets, so this is the
	// zero-inset device: each owned edge has to fall back to its design gutter
	// rather than collapsing to the raw inset.
	it("keeps its gutters when the runtime reports no insets", () => {
		const { getByTestId } = renderRouter(
			{ index: HomeScreen },
			{ initialUrl: "/" },
		);

		const root = StyleSheet.flatten(getByTestId("home-screen").props.style);

		expect(root.paddingTop).toBe(themes.light.gap.lg);
		expect(root.paddingStart).toBe(themes.light.gap.lg);
		expect(root.paddingEnd).toBe(themes.light.gap.lg);
	});
});
