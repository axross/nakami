import { describe, expect, it } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react-native";
import { renderRouter } from "expo-router/testing-library";
import { Text } from "react-native";
import { WelcomeScreen } from "./welcome-screen";

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
