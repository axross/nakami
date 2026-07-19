import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent } from "@testing-library/react-native";
import { renderRouter } from "expo-router/testing-library";
import { SettingsScreen } from "./settings-screen";

jest.mock("@sentry/react-native", () => ({
	showFeedbackWidget: jest.fn(),
}));

jest.mock("expo-dev-client", () => ({
	openMenu: jest.fn(),
}));

describe("<SettingsScreen>", () => {
	it("renders the About and Debug groups with their rows", () => {
		const { getByTestId, getByText } = renderRouter(
			{ index: SettingsScreen },
			{ initialUrl: "/" },
		);

		expect(getByTestId("settings-screen")).toBeTruthy();
		expect(getByText("About")).toBeTruthy();
		expect(getByText("Feedback")).toBeTruthy();
		expect(getByText("License")).toBeTruthy();
		expect(getByText("Debug")).toBeTruthy();
		expect(getByText("Open Dev Menu")).toBeTruthy();
	});

	it("renders the technical details readout", () => {
		const { getByTestId } = renderRouter(
			{ index: SettingsScreen },
			{ initialUrl: "/" },
		);

		const technicalDetails = getByTestId("settings-technical-details");

		expect(technicalDetails.props.children).toContain("Version:");
		expect(technicalDetails.props.children).toContain("Build:");
		expect(technicalDetails.props.children).toContain("SHA: Unknown");
	});

	it("opens the Sentry feedback widget when the Feedback row is pressed", () => {
		const { showFeedbackWidget } = jest.requireMock<
			typeof import("@sentry/react-native")
		>("@sentry/react-native");
		const { getByTestId } = renderRouter(
			{ index: SettingsScreen },
			{ initialUrl: "/" },
		);

		fireEvent.press(getByTestId("settings-feedback-row"));

		expect(showFeedbackWidget).toHaveBeenCalledTimes(1);
	});

	it("opens the dev menu when the Open Dev Menu row is pressed", () => {
		const { openMenu } =
			jest.requireMock<typeof import("expo-dev-client")>("expo-dev-client");
		const { getByTestId } = renderRouter(
			{ index: SettingsScreen },
			{ initialUrl: "/" },
		);

		fireEvent.press(getByTestId("settings-open-dev-menu-row"));

		expect(openMenu).toHaveBeenCalledTimes(1);
	});
});
