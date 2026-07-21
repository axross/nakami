import { describe, expect, it } from "@jest/globals";
import { renderRouter } from "expo-router/testing-library";
import { SettingsSignInGroup } from "./settings-sign-in-group";

describe("<SettingsSignInGroup>", () => {
	it("renders an Account group with a Sign in row", () => {
		const { getByTestId, getByText } = renderRouter(
			{ index: SettingsSignInGroup },
			{ initialUrl: "/" },
		);

		expect(getByText("Account")).toBeTruthy();
		expect(getByTestId("settings-sign-in-button")).toBeTruthy();
		expect(getByText("Sign in")).toBeTruthy();
	});

	it("exposes the Sign in row as a link", () => {
		const { getByTestId } = renderRouter(
			{ index: SettingsSignInGroup },
			{ initialUrl: "/" },
		);

		expect(getByTestId("settings-sign-in-button").props.accessibilityRole).toBe(
			"link",
		);
	});
});
