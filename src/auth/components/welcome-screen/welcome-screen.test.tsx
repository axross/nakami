import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react-native";
import { renderRouter } from "expo-router/testing-library";
import { Text } from "react-native";
import { WelcomeScreen } from "./welcome-screen";

// The MessageState mark loads its font asynchronously and setStates; stub the
// icon so the render stays synchronous and free of act(...) noise.
jest.mock("@expo/vector-icons/MaterialCommunityIcons", () => ({
	__esModule: true,
	default: () => null,
}));

describe("<WelcomeScreen>", () => {
	it("shows the connect prompt with a sign-in call to action", () => {
		renderRouter(
			{ index: WelcomeScreen, "sign-in": () => null },
			{ initialUrl: "/" },
		);

		expect(screen.getByTestId("welcome-screen")).toBeTruthy();
		expect(screen.getByText("Connect to Payload")).toBeTruthy();
		expect(screen.getByTestId("welcome-sign-in-button")).toBeTruthy();
	});

	it("navigates to the sign-in screen when the call to action is pressed", () => {
		renderRouter(
			{
				index: WelcomeScreen,
				"sign-in": () => <Text testID="sign-in-destination">sign in</Text>,
			},
			{ initialUrl: "/" },
		);

		fireEvent.press(screen.getByTestId("welcome-sign-in-button"));

		expect(screen.getByTestId("sign-in-destination")).toBeTruthy();
	});
});
