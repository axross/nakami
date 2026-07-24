import { describe, expect, it } from "@jest/globals";
import { renderRouter } from "expo-router/testing-library";
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
});
