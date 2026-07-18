import { describe, expect, it } from "@jest/globals";
import { renderRouter } from "expo-router/testing-library";
import HomeRoute from "./index";

describe("home route", () => {
	it("renders the home screen with the app title", () => {
		const { getByTestId, getByText } = renderRouter(
			{ index: HomeRoute },
			{ initialUrl: "/" },
		);

		expect(getByTestId("home-screen")).toBeTruthy();
		expect(getByText("Payload Mobile")).toBeTruthy();
	});
});
