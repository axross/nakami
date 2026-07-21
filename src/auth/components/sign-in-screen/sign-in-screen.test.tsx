import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, waitFor } from "@testing-library/react-native";
import { renderRouter } from "expo-router/testing-library";
import { readLastServerUrl } from "~/auth/helpers/last-server-url";
import { PayloadRequestError } from "~/auth/helpers/payload-client";
import { useSignIn } from "~/auth/mutations/use-sign-in";
import { SignInScreen } from "./sign-in-screen";

jest.mock("~/auth/mutations/use-sign-in", () => ({ useSignIn: jest.fn() }));
jest.mock("~/auth/helpers/last-server-url", () => ({
	readLastServerUrl: jest.fn(),
}));
// The collection field's icon loads its font asynchronously and setStates; stub
// it so the async-`waitFor` tests below don't emit spurious act(...) warnings.
jest.mock("@expo/vector-icons/MaterialCommunityIcons", () => ({
	__esModule: true,
	default: () => null,
}));

const mutate = jest.fn();
const reset = jest.fn();

function mockSignIn(overrides: { isPending?: boolean; error?: unknown } = {}) {
	jest.mocked(useSignIn).mockReturnValue({
		mutate,
		reset,
		isPending: overrides.isPending ?? false,
		error: overrides.error ?? null,
	} as unknown as ReturnType<typeof useSignIn>);
}

beforeEach(() => {
	jest.clearAllMocks();
	mockSignIn();
	jest.mocked(readLastServerUrl).mockResolvedValue(null);
});

describe("<SignInScreen>", () => {
	it("shows the collection value as text and reveals an input when edited", () => {
		const { getByTestId, queryByTestId } = renderRouter(
			{ "sign-in": SignInScreen },
			{ initialUrl: "/sign-in" },
		);

		expect(getByTestId("sign-in-collection-value").props.children).toBe(
			"users",
		);
		expect(queryByTestId("sign-in-collection-input")).toBeNull();

		fireEvent.press(getByTestId("sign-in-collection-edit"));

		expect(getByTestId("sign-in-collection-input")).toBeTruthy();
	});

	it("blocks submission and shows an error for an invalid server URL", () => {
		const { getByTestId } = renderRouter(
			{ "sign-in": SignInScreen },
			{ initialUrl: "/sign-in" },
		);

		fireEvent.changeText(getByTestId("sign-in-server-url"), "not-a-url");
		fireEvent.changeText(getByTestId("sign-in-email"), "you@example.com");
		fireEvent.changeText(getByTestId("sign-in-password"), "secret");
		fireEvent.press(getByTestId("sign-in-submit"));

		expect(getByTestId("sign-in-error")).toBeTruthy();
		expect(mutate).not.toHaveBeenCalled();
	});

	it("submits normalized credentials when the form is valid", () => {
		const { getByTestId } = renderRouter(
			{ "sign-in": SignInScreen },
			{ initialUrl: "/sign-in" },
		);

		fireEvent.changeText(
			getByTestId("sign-in-server-url"),
			"https://cms.example.com/",
		);
		fireEvent.changeText(getByTestId("sign-in-email"), " you@example.com ");
		fireEvent.changeText(getByTestId("sign-in-password"), "secret");
		fireEvent.press(getByTestId("sign-in-submit"));

		expect(mutate).toHaveBeenCalledTimes(1);
		expect(mutate.mock.calls[0][0]).toEqual({
			serverUrl: "https://cms.example.com",
			collectionSlug: "users",
			email: "you@example.com",
			password: "secret",
		});
	});

	it("maps an auth rejection to a friendly message", () => {
		mockSignIn({ error: new PayloadRequestError("auth", "rejected", 401) });

		const { getByTestId } = renderRouter(
			{ "sign-in": SignInScreen },
			{ initialUrl: "/sign-in" },
		);

		expect(getByTestId("sign-in-error").props.children).toBe(
			"Incorrect email or password.",
		);
	});

	it("pre-fills the server URL with the last-used endpoint", async () => {
		jest.mocked(readLastServerUrl).mockResolvedValue("https://cms.example.com");

		const { getByTestId } = renderRouter(
			{ "sign-in": SignInScreen },
			{ initialUrl: "/sign-in" },
		);

		await waitFor(() => {
			expect(getByTestId("sign-in-server-url").props.value).toBe(
				"https://cms.example.com",
			);
		});
	});

	it("leaves the server URL empty when none has been stored", async () => {
		const { getByTestId } = renderRouter(
			{ "sign-in": SignInScreen },
			{ initialUrl: "/sign-in" },
		);

		await waitFor(() => {
			expect(readLastServerUrl).toHaveBeenCalled();
		});
		expect(getByTestId("sign-in-server-url").props.value).toBe("");
	});
});
