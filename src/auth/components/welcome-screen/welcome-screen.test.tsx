import { describe, expect, it } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react-native";
import { renderRouter } from "expo-router/testing-library";
import { StyleSheet, Text } from "react-native";
import { themes } from "~/unistyles";
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

	// this screen has no header and no tab bar, so it owns all four edges — the
	// vertical pair from its own stylesheet, the horizontal pair from
	// `MessageState`. Unistyles' jest mock reports zero insets, so this is the
	// zero-inset device: every edge has to fall back to its design gutter
	// instead of collapsing to the raw inset.
	//
	// what this cannot see: at zero insets the vertical override resolves to the
	// same 24 as the base `MessageState` gutter it overrides, so a screen that
	// stopped passing `style` would still pass here. that the override reaches
	// the notch is the manual on-device check, not this one.
	it("keeps a gutter on all four edges when the runtime reports no insets", () => {
		renderRouter(
			{ index: WelcomeScreen, "sign-in": () => null },
			{ initialUrl: "/" },
		);

		const root = StyleSheet.flatten(
			screen.getByTestId("welcome-screen").props.style,
		);

		expect(root.paddingTop).toBe(themes.light.gap.lg);
		expect(root.paddingBottom).toBe(themes.light.gap.lg);
		expect(root.paddingStart).toBe(themes.light.gap.lg);
		expect(root.paddingEnd).toBe(themes.light.gap.lg);
	});

	// the assertion above cannot see the override, so this one pins the wiring
	// instead of the value: that this screen passes a vertical pair down at all.
	// without it, deleting `style={styles.screen}` removes the only thing giving
	// the welcome screen its owned top and bottom edges, and every other test
	// stays green — `MessageState`'s own gutter answers with the same 24.
	it("passes its own vertical pair down to MessageState", () => {
		renderRouter(
			{ index: WelcomeScreen, "sign-in": () => null },
			{ initialUrl: "/" },
		);

		const style = screen.getByTestId("welcome-screen").props.style;

		expect(Array.isArray(style)).toBe(true);
		expect(style.at(-1)).toEqual(
			expect.objectContaining({
				paddingBottom: expect.any(Number),
				paddingTop: expect.any(Number),
			}),
		);
	});
});
