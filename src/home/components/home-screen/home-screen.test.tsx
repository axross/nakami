import { afterEach, describe, expect, it } from "@jest/globals";
import { renderRouter } from "expo-router/testing-library";
import { useAuthStore } from "~/auth/stores/auth-store";
import { HomeScreen } from "./home-screen";

afterEach(() => {
	useAuthStore.setState({ status: "loading", session: null });
});

describe("<HomeScreen>", () => {
	it("shows the empty state with a sign-in call to action when unauthenticated", () => {
		useAuthStore.setState({ status: "unauthenticated", session: null });

		const { getByTestId, getByText } = renderRouter(
			{ index: HomeScreen },
			{ initialUrl: "/" },
		);

		expect(getByTestId("home-screen")).toBeTruthy();
		expect(getByText("Connect to Payload")).toBeTruthy();
		expect(getByTestId("home-sign-in-button")).toBeTruthy();
	});

	it("shows the app placeholder when authenticated", () => {
		useAuthStore.setState({ status: "authenticated", session: null });

		const { getByTestId, getByText } = renderRouter(
			{ index: HomeScreen },
			{ initialUrl: "/" },
		);

		expect(getByTestId("home-screen")).toBeTruthy();
		expect(getByText("Nakami")).toBeTruthy();
		expect(getByText("A companion mobile app for Payload CMS.")).toBeTruthy();
	});
});
