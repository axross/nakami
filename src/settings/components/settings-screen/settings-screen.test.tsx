import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { QueryClientProvider } from "@tanstack/react-query";
import { fireEvent } from "@testing-library/react-native";
import { renderRouter } from "expo-router/testing-library";
import { StyleSheet } from "react-native";
import type { Session } from "~/auth/models/session";
import { useAuthStore } from "~/auth/stores/auth-store";
import { createTestQueryClient } from "~/common/test-helpers/query-client";
import { themes } from "~/unistyles";
import { SettingsScreen } from "./settings-screen";

jest.mock("@sentry/react-native", () => ({
	showFeedbackWidget: jest.fn(),
}));

jest.mock("expo-dev-client", () => ({
	openMenu: jest.fn(),
}));

jest.mock("~/settings/helpers/commit-hash", () => ({
	getCommitHash: () => "9b05d81",
}));

const session: Session = {
	serverUrl: "https://cms.example.com",
	collectionSlug: "users",
	token: "jwt-token",
	exp: 1_800_000_000,
	user: { id: "1", email: "you@example.com" },
};

// The Account group consumes the sign-out mutation via `useMutation`, so render
// under a fresh, isolated QueryClient — the mutation stays idle here (never
// invoked), and the real store still drives the auth-gated rows.
function renderSettingsScreen() {
	const client = createTestQueryClient();
	return renderRouter(
		{
			index: () => (
				<QueryClientProvider client={client}>
					<SettingsScreen />
				</QueryClientProvider>
			),
		},
		{ initialUrl: "/" },
	);
}

afterEach(() => {
	useAuthStore.setState({ status: "loading", session: null });
});

describe("<SettingsScreen>", () => {
	it("renders the About and Debug groups with their rows", () => {
		const { getByTestId, getByText } = renderSettingsScreen();

		expect(getByTestId("settings-screen")).toBeTruthy();
		expect(getByText("About")).toBeTruthy();
		expect(getByText("Feedback")).toBeTruthy();
		expect(getByText("License")).toBeTruthy();
		expect(getByText("Debug")).toBeTruthy();
		expect(getByText("Open Dev Menu")).toBeTruthy();
	});

	it("renders the technical details readout", () => {
		const { getByTestId } = renderSettingsScreen();

		const technicalDetails = getByTestId("settings-technical-details");

		expect(technicalDetails.props.children).toContain("Version:");
		expect(technicalDetails.props.children).toContain("Build:");
		expect(technicalDetails.props.children).toContain("SHA: 9b05d81");
	});

	it("renders the non-affiliation trademark disclaimer", () => {
		const { getByTestId } = renderSettingsScreen();

		const disclaimer = getByTestId("settings-disclaimer");

		expect(disclaimer.props.children).toContain("Nakami is an independent");
		expect(disclaimer.props.children).toContain("not affiliated with");
	});

	it("opens the Sentry feedback widget when the Feedback row is pressed", () => {
		const { showFeedbackWidget } = jest.requireMock<
			typeof import("@sentry/react-native")
		>("@sentry/react-native");
		const { getByTestId } = renderSettingsScreen();

		fireEvent.press(getByTestId("settings-feedback-row"));

		expect(showFeedbackWidget).toHaveBeenCalledTimes(1);
	});

	it("opens the dev menu when the Open Dev Menu row is pressed", () => {
		const { openMenu } =
			jest.requireMock<typeof import("expo-dev-client")>("expo-dev-client");
		const { getByTestId } = renderSettingsScreen();

		fireEvent.press(getByTestId("settings-open-dev-menu-row"));

		expect(openMenu).toHaveBeenCalledTimes(1);
	});

	it("hides the Debug group and Open Dev Menu row in a release build", () => {
		// __DEV__ is a const-typed global, so cast to a writable shape to
		// simulate a release build (__DEV__ === false), then restore it.
		const devFlag = globalThis as unknown as { __DEV__: boolean };
		const wasDev = devFlag.__DEV__;
		devFlag.__DEV__ = false;

		try {
			const { queryByText, queryByTestId } = renderSettingsScreen();

			expect(queryByText("Debug")).toBeNull();
			expect(queryByTestId("settings-open-dev-menu-row")).toBeNull();
		} finally {
			devFlag.__DEV__ = wasDev;
		}
	});

	it("shows the Account group with the user email and Sign out", () => {
		useAuthStore.setState({ status: "authenticated", session });

		const { getByTestId, getByText } = renderSettingsScreen();

		expect(getByTestId("settings-account-row")).toBeTruthy();
		expect(getByText("you@example.com")).toBeTruthy();
		expect(getByText("https://cms.example.com")).toBeTruthy();
		expect(getByTestId("settings-sign-out-row")).toBeTruthy();
		expect(getByText("Sign out")).toBeTruthy();
	});

	// The last row used to sit flush against the tab bar; the content container
	// now ends with the screen's own gutter. Unistyles' jest mock reports zero
	// insets, so this is the zero-inset device — the gutter is unconditional
	// here, unlike the horizontal pair, which is deliberately the bare inset
	// because the child rows carry that gutter themselves.
	it("separates the last row from the tab bar with the screen's gutter", () => {
		const { getByTestId } = renderSettingsScreen();

		const content = StyleSheet.flatten(
			getByTestId("settings-screen").props.contentContainerStyle,
		);

		expect(content.paddingBottom).toBe(themes.light.gap.lg);
	});

	// The horizontal pair is the bare inset by design — the child rows carry the
	// gutter — so this screen is the one that asserts zero rather than a gutter.
	// Flooring it against `theme.gap.md` would read as a fix and would stack a
	// second gutter on every row; pinning it here is what makes that regression
	// fail a test instead of shipping.
	it("leaves the horizontal pair as the bare inset, since the rows carry the gutter", () => {
		const { getByTestId } = renderSettingsScreen();

		const content = StyleSheet.flatten(
			getByTestId("settings-screen").props.contentContainerStyle,
		);

		expect(content.paddingStart).toBe(0);
		expect(content.paddingEnd).toBe(0);
	});
});
