import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import { themes } from "~/unistyles";
import { CredentialConsentDialog } from "./credential-consent-dialog";

function renderDialog(
	props: Partial<Parameters<typeof CredentialConsentDialog>[0]> = {},
) {
	return render(
		<CredentialConsentDialog
			onAllow={jest.fn()}
			onDecline={jest.fn()}
			serverUrl="https://cms.example.com"
			{...props}
		/>,
	);
}

describe("<CredentialConsentDialog>", () => {
	// the dialog exists to make a decision informed, so a build that quietly
	// dropped either half would still look like a working consent prompt. this
	// is what says both halves are on screen.
	it("states what storing buys and what it costs", () => {
		renderDialog();

		expect(screen.getByTestId("credential-consent-benefit")).toBeTruthy();
		expect(screen.getByTestId("credential-consent-risk")).toBeTruthy();
		expect(screen.getByText("What storing it buys")).toBeTruthy();
		expect(screen.getByText("What storing it costs")).toBeTruthy();
	});

	it("names the server the session belongs to", () => {
		renderDialog({ serverUrl: "https://payload.example.org" });

		expect(screen.getByText(/https:\/\/payload\.example\.org/)).toBeTruthy();
	});

	// there is no toggle in Settings, so the dialog is the only place this is
	// ever said. a change that dropped it would leave a user who allowed the
	// storage with no stated way to take it back.
	it("says how to change the answer later", () => {
		renderDialog();

		expect(
			screen.getByText(
				"Signing out removes it. To change this later, sign out and sign in again.",
			),
		).toBeTruthy();
	});

	it("offers exactly two answers, both as buttons", () => {
		renderDialog();

		expect(
			screen.getByTestId("credential-consent-allow").props.accessibilityRole,
		).toBe("button");
		expect(
			screen.getByTestId("credential-consent-decline").props.accessibilityRole,
		).toBe("button");
	});

	// equal prominence is the difference between a consent prompt and a nudge, so
	// it is asserted rather than left to the eye: the two answers share a height,
	// and neither is a bare text link under the other.
	it("gives both answers the same height", () => {
		renderDialog();

		const allow = StyleSheet.flatten(
			screen.getByTestId("credential-consent-allow").props.style,
		);
		const decline = StyleSheet.flatten(
			screen.getByTestId("credential-consent-decline").props.style,
		);

		expect(allow.minHeight).toBe(decline.minHeight);
		expect(allow.minHeight).toBe(50);
	});

	it("routes a press of the allow answer to onAllow alone", () => {
		const onAllow = jest.fn();
		const onDecline = jest.fn();

		renderDialog({ onAllow, onDecline });
		fireEvent.press(screen.getByTestId("credential-consent-allow"));

		expect(onAllow).toHaveBeenCalledTimes(1);
		expect(onDecline).not.toHaveBeenCalled();
	});

	it("routes a press of the decline answer to onDecline alone", () => {
		const onAllow = jest.fn();
		const onDecline = jest.fn();

		renderDialog({ onAllow, onDecline });
		fireEvent.press(screen.getByTestId("credential-consent-decline"));

		expect(onDecline).toHaveBeenCalledTimes(1);
		expect(onAllow).not.toHaveBeenCalled();
	});

	// only ever set while the answer already given is being written, and it
	// disables both — a second press must not queue the other answer behind the
	// first, which would store a password the user went on to refuse.
	it("disables both answers while one is being written", () => {
		renderDialog({ disabled: true });

		expect(
			screen.getByTestId("credential-consent-allow").props.accessibilityState,
		).toEqual({ disabled: true });
		expect(
			screen.getByTestId("credential-consent-decline").props.accessibilityState,
		).toEqual({ disabled: true });
	});

	// the dialog covers the screen edge to edge, under the system bars with it,
	// so it owns all four edges rather than the bottom-and-horizontal trio the
	// sign-in screen behind it owns. Unistyles' jest mock reports zero insets, so
	// this is the zero-inset device: every owned edge falls back to its gutter.
	it("keeps a gutter on all four edges when the runtime reports no insets", () => {
		renderDialog();

		const scrim = StyleSheet.flatten(
			screen.getByTestId("credential-consent-scrim").props.style,
		);

		expect(scrim.paddingTop).toBe(themes.light.gap.md);
		expect(scrim.paddingBottom).toBe(themes.light.gap.md);
		expect(scrim.paddingStart).toBe(themes.light.gap.md);
		expect(scrim.paddingEnd).toBe(themes.light.gap.md);
	});
});
