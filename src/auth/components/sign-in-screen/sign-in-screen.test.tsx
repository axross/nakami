import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, waitFor } from "@testing-library/react-native";
import { renderRouter } from "expo-router/testing-library";
import { readLastServerUrl } from "~/auth/helpers/last-server-url";
import { login, PayloadRequestError } from "~/auth/helpers/payload-client";
import { createTestQueryClient } from "~/common/helpers/test-query-client";
import { SignInScreen } from "./sign-in-screen";

// Mock only the data layer the real mutation calls — `login` — keeping
// `PayloadRequestError` real so the error-mapping path is exercised end to end.
jest.mock("~/auth/helpers/payload-client", () => ({
	...jest.requireActual<typeof import("~/auth/helpers/payload-client")>(
		"~/auth/helpers/payload-client",
	),
	login: jest.fn(),
}));
// The sign-in mutation persists the session via the auth store's `authenticate`
// action (read non-reactively with `getState()`); stub it to a resolved no-op so
// the success path does not touch the keychain.
jest.mock("~/auth/stores/auth-store", () => ({
	...jest.requireActual<typeof import("~/auth/stores/auth-store")>(
		"~/auth/stores/auth-store",
	),
	useAuthStore: { getState: () => ({ authenticate: jest.fn(async () => {}) }) },
}));
jest.mock("~/auth/helpers/last-server-url", () => ({
	readLastServerUrl: jest.fn(),
}));
// The collection field's icon loads its font asynchronously and setStates; stub
// it so the async-`waitFor` tests below don't emit spurious act(...) warnings.
jest.mock("@expo/vector-icons/MaterialCommunityIcons", () => ({
	__esModule: true,
	default: () => null,
}));

// Render the screen under a fresh, isolated QueryClient (retries off) so the
// real `useMutation` runs; tests drive the actual mutation and assert its
// observable outcome rather than stubbing the hook.
function renderSignInScreen() {
	const client = createTestQueryClient();
	return renderRouter(
		{
			"sign-in": () => (
				<QueryClientProvider client={client}>
					<SignInScreen />
				</QueryClientProvider>
			),
		},
		{ initialUrl: "/sign-in" },
	);
}

beforeEach(() => {
	jest.clearAllMocks();
	jest.mocked(readLastServerUrl).mockResolvedValue(null);
});

describe("<SignInScreen>", () => {
	it("shows the collection value as text and reveals an input when edited", () => {
		const { getByTestId, queryByTestId } = renderSignInScreen();

		expect(getByTestId("sign-in-collection-value").props.children).toBe(
			"users",
		);
		expect(queryByTestId("sign-in-collection-input")).toBeNull();

		fireEvent.press(getByTestId("sign-in-collection-edit"));

		expect(getByTestId("sign-in-collection-input")).toBeTruthy();
	});

	it("blocks submission and shows an error for an invalid server URL", () => {
		const { getByTestId } = renderSignInScreen();

		fireEvent.changeText(getByTestId("sign-in-server-url"), "not-a-url");
		fireEvent.changeText(getByTestId("sign-in-email"), "you@example.com");
		fireEvent.changeText(getByTestId("sign-in-password"), "secret");
		fireEvent.press(getByTestId("sign-in-submit"));

		expect(getByTestId("sign-in-error")).toBeTruthy();
		expect(login).not.toHaveBeenCalled();
	});

	it("submits normalized credentials when the form is valid", async () => {
		// Leave the login pending so the assertion targets the credentials handed
		// to the data layer, without driving the success/navigation path.
		jest
			.mocked(login)
			.mockReturnValue(
				new Promise<Awaited<ReturnType<typeof login>>>(() => {}),
			);

		const { getByTestId } = renderSignInScreen();

		fireEvent.changeText(
			getByTestId("sign-in-server-url"),
			"https://cms.example.com/",
		);
		fireEvent.changeText(getByTestId("sign-in-email"), " you@example.com ");
		fireEvent.changeText(getByTestId("sign-in-password"), "secret");
		fireEvent.press(getByTestId("sign-in-submit"));

		await waitFor(() => {
			expect(login).toHaveBeenCalledWith(
				{ serverUrl: "https://cms.example.com", collectionSlug: "users" },
				{ email: "you@example.com", password: "secret" },
			);
		});
	});

	it("maps an auth rejection to a friendly message", async () => {
		jest
			.mocked(login)
			.mockRejectedValue(new PayloadRequestError("auth", "rejected", 401));

		const { getByTestId } = renderSignInScreen();

		fireEvent.changeText(
			getByTestId("sign-in-server-url"),
			"https://cms.example.com",
		);
		fireEvent.changeText(getByTestId("sign-in-email"), "you@example.com");
		fireEvent.changeText(getByTestId("sign-in-password"), "secret");
		fireEvent.press(getByTestId("sign-in-submit"));

		await waitFor(() => {
			expect(getByTestId("sign-in-error").props.children).toBe(
				"Incorrect email or password.",
			);
		});
	});

	it("pre-fills the server URL with the last-used endpoint", async () => {
		jest.mocked(readLastServerUrl).mockResolvedValue("https://cms.example.com");

		const { getByTestId } = renderSignInScreen();

		await waitFor(() => {
			expect(getByTestId("sign-in-server-url").props.value).toBe(
				"https://cms.example.com",
			);
		});
	});

	it("leaves the server URL empty when none has been stored", async () => {
		const { getByTestId } = renderSignInScreen();

		await waitFor(() => {
			expect(readLastServerUrl).toHaveBeenCalled();
		});
		expect(getByTestId("sign-in-server-url").props.value).toBe("");
	});
});
