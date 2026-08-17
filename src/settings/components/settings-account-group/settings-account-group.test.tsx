import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import type { Session } from "~/auth/models/session";
import { useAuthStore } from "~/auth/stores/auth-store";
import { createTestQueryClient } from "~/common/test-helpers/query-client";
import { SettingsAccountGroup } from "./settings-account-group";

// leave the sign-out request pending, so the row's in-flight state stays on
// screen for the assertions below. the real options are replaced wholesale
// rather than stubbed at the data layer: this suite is about the row's states,
// not about what signing out does.
jest.mock("~/auth/mutations/sign-out-mutation", () => ({
	getSignOutMutationOptions: () => ({
		mutationKey: ["auth-session", "current", "sign-out"],
		mutationFn: () => new Promise<void>(() => {}),
	}),
}));

const session: Session = {
	serverUrl: "https://cms.example.com",
	collectionSlug: "users",
	token: "jwt-token",
	exp: 1_800_000_000,
	user: { id: "1", email: "you@example.com" },
};

function renderAccountGroup() {
	useAuthStore.setState({ status: "authenticated", session });
	const client = createTestQueryClient();

	return render(
		<QueryClientProvider client={client}>
			<SettingsAccountGroup />
		</QueryClientProvider>,
	);
}

afterEach(() => {
	useAuthStore.setState({ status: "loading", session: null });
});

describe("<SettingsAccountGroup>", () => {
	it("offers Sign out while no sign-out is in flight", () => {
		const { getByTestId, getByText, queryByTestId } = renderAccountGroup();

		expect(getByText("Sign out")).toBeTruthy();
		expect(queryByTestId("settings-sign-out-spinner")).toBeNull();
		expect(
			getByTestId("settings-sign-out-row").props.accessibilityState,
		).toEqual({ disabled: false });
	});

	// a row that only stops responding reads as broken rather than as busy, so
	// the in-flight sign-out has to say so. the fill it also changes to is a
	// variant of `SettingMenuGroupItem`, which the Unistyles jest mock strips —
	// setting-menu-group-item.test.tsx asserts that selection, and what is left
	// observable here is the label, the spinner, and the disabled state.
	it("shows the sign-out as working once it is in flight", async () => {
		const { getByTestId, getByText, queryByText } = renderAccountGroup();

		fireEvent.press(getByTestId("settings-sign-out-row"));

		await waitFor(() => {
			expect(getByText("Signing out…")).toBeTruthy();
		});
		expect(queryByText("Sign out")).toBeNull();

		const row = getByTestId("settings-sign-out-row");

		expect(row.props.accessibilityState).toEqual({ disabled: true });
		// the spinner stands in for the `LogOut` icon while the row is disabled.
		expect(getByTestId("settings-sign-out-spinner")).toBeTruthy();
	});
});
