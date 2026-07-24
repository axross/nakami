import { afterEach, describe, expect, it } from "@jest/globals";
import { screen } from "@testing-library/react-native";
import { renderRouter } from "expo-router/testing-library";
import { Text } from "react-native";
import { useAuthStore } from "~/auth/stores/auth-store";
import { RootNavigator } from "./root-navigator";

// Stub the child screens so the gate is tested without the native tab bar
// (which does not render under jest) or the real screens' dependencies.
const routes = {
	_layout: RootNavigator,
	"(tabs)/index": () => <Text testID="tabs-home">tabs home</Text>,
	welcome: () => <Text testID="welcome">welcome</Text>,
	"sign-in": () => <Text testID="sign-in">sign in</Text>,
};

afterEach(() => {
	useAuthStore.setState({ status: "loading", session: null });
});

describe("<RootNavigator>", () => {
	it("shows the welcome screen and no tabs while unauthenticated", () => {
		useAuthStore.setState({ status: "unauthenticated", session: null });

		renderRouter(routes, { initialUrl: "/" });

		expect(screen.getByTestId("welcome")).toBeTruthy();
		expect(screen.queryByTestId("tabs-home")).toBeNull();
	});

	it("mounts the tab UI once authenticated", () => {
		useAuthStore.setState({ status: "authenticated", session: null });

		renderRouter(routes, { initialUrl: "/" });

		expect(screen.getByTestId("tabs-home")).toBeTruthy();
		expect(screen.queryByTestId("welcome")).toBeNull();
	});
});
