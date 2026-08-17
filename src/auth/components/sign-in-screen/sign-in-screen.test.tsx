import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, waitFor, within } from "@testing-library/react-native";
import { renderRouter } from "expo-router/testing-library";
import { AccessibilityInfo, StyleSheet, TextInput } from "react-native";
import { readLastServerUrl } from "~/auth/helpers/last-server-url";
import { login, PayloadRequestError } from "~/auth/helpers/payload-client";
import { createTestQueryClient } from "~/common/helpers/test-query-client";
import { themes } from "~/unistyles";
import { SignInScreen } from "./sign-in-screen";

// mock only the data layer the real mutation calls — `login` — keeping
// `PayloadRequestError` real so the error-mapping path is exercised end to end.
jest.mock("~/auth/helpers/payload-client", () => ({
	...jest.requireActual<typeof import("~/auth/helpers/payload-client")>(
		"~/auth/helpers/payload-client",
	),
	login: jest.fn(),
}));
// the sign-in mutation persists the session via the auth store's `authenticate`
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

// render the screen under a fresh, isolated QueryClient (retries off) so the
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

/** leaves the sign-in request pending, so the in-flight state stays on screen. */
function leaveLoginPending() {
	jest
		.mocked(login)
		.mockReturnValue(new Promise<Awaited<ReturnType<typeof login>>>(() => {}));
}

// the screen announces through `AccessibilityInfo` on iOS, because the live
// region its message components carry is Android-only. `jest-expo` runs this
// suite as iOS, so that branch is the live one and needs no platform stub.
// spied once at module scope; `jest.clearAllMocks()` below resets its calls
// between tests.
const announceSpy = jest.spyOn(
	AccessibilityInfo,
	"announceForAccessibilityWithOptions",
);

/** this screen's four text inputs, by `testID`. */
const SIGN_IN_INPUT_TEST_IDS: ReadonlySet<string> = new Set([
	"sign-in-server-url",
	"sign-in-collection-input",
	"sign-in-email",
	"sign-in-password",
]);

/**
 * the `testID` of the sign-in input the screen last called `focus()` on, or
 * `undefined` when it called none.
 *
 * React Native's jest preset mocks each native component as a class and copies
 * one shared `MockNativeMethods` object onto every such prototype, so this
 * `focus` is a single `jest.fn` behind `TextInput`, `View`, and every other
 * mocked native component alike. `mock.instances` is therefore a suite-wide log
 * of focus calls on any of them, which is why it is filtered to this screen's
 * own inputs before the last entry is taken rather than trusted as-is.
 *
 * it is the only seam that observes a programmatic focus here: the runtime's
 * own `TextInput.State.currentlyFocusedInput()` never updates under the mock,
 * and the element RNTL hands back carries no `focus` of its own.
 */
function lastFocusedTestId(): string | undefined {
	const { focus } = TextInput.prototype as unknown as {
		focus: { mock: { instances: readonly { props?: { testID?: string } }[] } };
	};

	return focus.mock.instances
		.map((instance) => instance?.props?.testID)
		.filter(
			(testID) => testID !== undefined && SIGN_IN_INPUT_TEST_IDS.has(testID),
		)
		.at(-1);
}

// a field-message row is out of the iOS accessibility tree on purpose — its
// message is already in the input's own name, and this suite runs as iOS. every
// query for one therefore has to opt into hidden elements: without this a
// `queryBy*` would match nothing and pass whether the message was cleared or
// merely hidden.
const HIDDEN = { includeHiddenElements: true } as const;

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

	it("blocks submission and flags the Server URL field for an invalid URL", () => {
		const { getByTestId } = renderSignInScreen();

		fireEvent.changeText(getByTestId("sign-in-server-url"), "not-a-url");
		fireEvent.changeText(getByTestId("sign-in-email"), "you@example.com");
		fireEvent.changeText(getByTestId("sign-in-password"), "secret");
		fireEvent.press(getByTestId("sign-in-submit"));

		expect(
			within(getByTestId("sign-in-error-server-url", HIDDEN)).getByText(
				"Enter a valid server URL, e.g. https://cms.example.com.",
				HIDDEN,
			),
		).toBeTruthy();
		expect(login).not.toHaveBeenCalled();
	});

	// the defect this screen was built to fix: the button used to grey itself out
	// until every field was filled, so the message naming the blank field could
	// never be reached.
	it("stays pressable with a blank field and names that field on press", () => {
		const { getByTestId } = renderSignInScreen();

		fireEvent.changeText(
			getByTestId("sign-in-server-url"),
			"https://cms.example.com",
		);
		fireEvent.changeText(getByTestId("sign-in-password"), "secret");

		expect(getByTestId("sign-in-submit").props.accessibilityState).toEqual({
			disabled: false,
		});

		fireEvent.press(getByTestId("sign-in-submit"));

		expect(
			within(getByTestId("sign-in-error-email", HIDDEN)).getByText(
				"Enter your email address.",
				HIDDEN,
			),
		).toBeTruthy();
		expect(login).not.toHaveBeenCalled();
	});

	it("reports every blank field at once, preceded by the problem count", () => {
		const { getByTestId } = renderSignInScreen();

		fireEvent.press(getByTestId("sign-in-submit"));

		expect(
			within(getByTestId("sign-in-error-summary")).getByText(
				"3 problems to fix",
			),
		).toBeTruthy();
		expect(getByTestId("sign-in-error-server-url", HIDDEN)).toBeTruthy();
		expect(getByTestId("sign-in-error-email", HIDDEN)).toBeTruthy();
		expect(getByTestId("sign-in-error-password", HIDDEN)).toBeTruthy();
		expect(login).not.toHaveBeenCalled();
	});

	it("leaves the count out when a single field is at fault", () => {
		const { getByTestId, queryByTestId } = renderSignInScreen();

		fireEvent.changeText(
			getByTestId("sign-in-server-url"),
			"https://cms.example.com",
		);
		fireEvent.changeText(getByTestId("sign-in-email"), "you@example.com");
		fireEvent.press(getByTestId("sign-in-submit"));

		expect(getByTestId("sign-in-error-password", HIDDEN)).toBeTruthy();
		expect(queryByTestId("sign-in-error-summary")).toBeNull();
	});

	// the count is a control rather than a line of text, which is what lets it
	// send the user to the first field that is at fault.
	it("sends the problem count's press to the first offending input", () => {
		const { getByTestId } = renderSignInScreen();

		fireEvent.changeText(
			getByTestId("sign-in-server-url"),
			"https://cms.example.com",
		);
		fireEvent.press(getByTestId("sign-in-submit"));

		const summary = getByTestId("sign-in-error-summary");

		expect(summary.props.accessibilityRole).toBe("button");
		expect(lastFocusedTestId()).toBeUndefined();

		fireEvent.press(summary);

		// Email and password are both blank; email is the one nearer the top.
		expect(lastFocusedTestId()).toBe("sign-in-email");
	});

	it("focuses the Collection input when it is the first offending field", () => {
		const { getByTestId } = renderSignInScreen();

		fireEvent.changeText(
			getByTestId("sign-in-server-url"),
			"https://cms.example.com",
		);
		fireEvent.press(getByTestId("sign-in-collection-edit"));
		fireEvent.changeText(getByTestId("sign-in-collection-input"), "");
		fireEvent.press(getByTestId("sign-in-submit"));

		fireEvent.press(getByTestId("sign-in-error-summary"));

		expect(getByTestId("sign-in-collection-input")).toBeTruthy();
		expect(getByTestId("sign-in-error-collection", HIDDEN)).toBeTruthy();
		expect(lastFocusedTestId()).toBe("sign-in-collection-input");
	});

	// a flagged input's border and tint are cues only a sighted user gets. React
	// Native has no `aria-describedby` to bind the message node to the input, so
	// the message is folded into the input's own accessible name — which is what
	// a reader arriving from the summary's press actually hears.
	it("names each flagged input with its own message", () => {
		const { getByTestId } = renderSignInScreen();

		// Collection is only ever emptied through its own input, so it has to be
		// opened before it can be at fault.
		fireEvent.press(getByTestId("sign-in-collection-edit"));
		fireEvent.changeText(getByTestId("sign-in-collection-input"), "");
		fireEvent.press(getByTestId("sign-in-submit"));

		expect(getByTestId("sign-in-server-url").props.accessibilityLabel).toBe(
			"Server URL, Enter your server URL.",
		);
		expect(
			getByTestId("sign-in-collection-input").props.accessibilityLabel,
		).toBe("Collection, Enter the auth collection slug.");
		expect(getByTestId("sign-in-email").props.accessibilityLabel).toBe(
			"Email, Enter your email address.",
		);
		expect(getByTestId("sign-in-password").props.accessibilityLabel).toBe(
			"Password, Enter your password.",
		);
	});

	// the flagged surface is the error's other two cues, beside the message's own
	// icon. one definition now serves every input on the screen, so this pins
	// that the shared style still resolves to the destructive pair.
	it("flags the offending input's own surface, not just the message beside it", () => {
		const { getByTestId } = renderSignInScreen();

		expect(
			StyleSheet.flatten(getByTestId("sign-in-email").props.style).borderColor,
		).toBe(themes.light.colors.border.neutral.subtle);

		fireEvent.press(getByTestId("sign-in-submit"));

		const flagged = StyleSheet.flatten(
			getByTestId("sign-in-email").props.style,
		);

		expect(flagged.borderColor).toBe(
			themes.light.colors.border.destructive.base,
		);
		expect(flagged.backgroundColor).toBe(
			themes.light.colors.foundation.destructive.subtle,
		);
	});

	it("returns an input's name to its plain label once the message clears", () => {
		const { getByTestId } = renderSignInScreen();

		fireEvent.press(getByTestId("sign-in-submit"));
		expect(getByTestId("sign-in-email").props.accessibilityLabel).toBe(
			"Email, Enter your email address.",
		);

		fireEvent.changeText(getByTestId("sign-in-email"), "you@example.com");

		expect(getByTestId("sign-in-email").props.accessibilityLabel).toBe("Email");
		// the field beside it keeps both its message and its named state.
		expect(getByTestId("sign-in-password").props.accessibilityLabel).toBe(
			"Password, Enter your password.",
		);
	});

	// the live region is the whole of the Android half of the announcement
	// design — `announce()` is guarded to iOS, and this suite runs as iOS, so
	// without these assertions the prop could be dropped from every surface and
	// nothing here or in CI would notice.
	it("wraps its validation messages in a polite live region", () => {
		const { getByTestId } = renderSignInScreen();

		fireEvent.press(getByTestId("sign-in-submit"));

		expect(
			getByTestId("sign-in-error-summary").props.accessibilityLiveRegion,
		).toBe("polite");
		expect(
			getByTestId("sign-in-error-email", HIDDEN).props.accessibilityLiveRegion,
		).toBe("polite");
	});

	// the message is already in the input's own accessible name, and this row is
	// the next element after that input — so on iOS it would otherwise be read
	// twice in one pass. the banners are not hidden: the count is a control a
	// reader has to be able to reach, and neither its text nor the server's
	// message is duplicated anywhere else.
	it("hides a field message from VoiceOver, which already has it in the input's name", () => {
		const { getByTestId } = renderSignInScreen();

		fireEvent.press(getByTestId("sign-in-submit"));

		expect(
			getByTestId("sign-in-error-email", HIDDEN).props
				.accessibilityElementsHidden,
		).toBe(true);
		expect(
			getByTestId("sign-in-error-summary").props.accessibilityElementsHidden,
		).toBeFalsy();
	});

	it("wraps the server's rejection in a polite live region", async () => {
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
			expect(getByTestId("sign-in-error").props.accessibilityLiveRegion).toBe(
				"polite",
			);
		});
	});

	// the message components' live region is Android-only, so iOS is announced
	// imperatively; the suite runs as iOS, which is the branch asserted here.
	it("announces the problem count to a screen reader on press", () => {
		const { getByTestId } = renderSignInScreen();

		fireEvent.press(getByTestId("sign-in-submit"));

		expect(announceSpy).toHaveBeenCalledWith("3 problems to fix", {
			queue: true,
		});
	});

	it("announces the one message when a single field is at fault", () => {
		const { getByTestId } = renderSignInScreen();

		fireEvent.changeText(
			getByTestId("sign-in-server-url"),
			"https://cms.example.com",
		);
		fireEvent.changeText(getByTestId("sign-in-email"), "you@example.com");
		fireEvent.press(getByTestId("sign-in-submit"));

		expect(announceSpy).toHaveBeenCalledWith("Enter your password.", {
			queue: true,
		});
	});

	// blur validation raises a message with no press behind it, so nothing else
	// would announce it.
	it("announces a message raised by leaving a field", () => {
		const { getByTestId } = renderSignInScreen();

		fireEvent(getByTestId("sign-in-email"), "blur");

		expect(announceSpy).toHaveBeenCalledWith("Enter your email address.", {
			queue: true,
		});
	});

	it("does not repeat an announcement a field is already showing", () => {
		const { getByTestId } = renderSignInScreen();

		fireEvent(getByTestId("sign-in-email"), "blur");
		fireEvent(getByTestId("sign-in-email"), "blur");

		expect(announceSpy).toHaveBeenCalledTimes(1);
	});

	it("announces the server's rejection", async () => {
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
			expect(announceSpy).toHaveBeenCalledWith("Incorrect email or password.", {
				queue: true,
			});
		});
	});

	it("flags a field when focus leaves it, without a press of Sign in", () => {
		const { getByTestId, queryByTestId } = renderSignInScreen();

		expect(queryByTestId("sign-in-error-email", HIDDEN)).toBeNull();

		fireEvent(getByTestId("sign-in-email"), "blur");

		expect(
			within(getByTestId("sign-in-error-email", HIDDEN)).getByText(
				"Enter your email address.",
				HIDDEN,
			),
		).toBeTruthy();
		// blurring one field says nothing about the others.
		expect(queryByTestId("sign-in-error-password", HIDDEN)).toBeNull();
	});

	it("clears a field's message as it is corrected, leaving the others standing", () => {
		const { getByTestId, queryByTestId } = renderSignInScreen();

		fireEvent.press(getByTestId("sign-in-submit"));
		expect(getByTestId("sign-in-error-email", HIDDEN)).toBeTruthy();

		fireEvent.changeText(getByTestId("sign-in-email"), "you@example.com");

		expect(queryByTestId("sign-in-error-email", HIDDEN)).toBeNull();
		expect(getByTestId("sign-in-error-password", HIDDEN)).toBeTruthy();
		expect(
			within(getByTestId("sign-in-error-summary")).getByText(
				"2 problems to fix",
			),
		).toBeTruthy();
	});

	it("keeps the values already entered after a failed submit", () => {
		const { getByTestId } = renderSignInScreen();

		fireEvent.changeText(
			getByTestId("sign-in-server-url"),
			"https://cms.example.com",
		);
		fireEvent.changeText(getByTestId("sign-in-email"), "you@example.com");
		fireEvent.press(getByTestId("sign-in-submit"));

		expect(getByTestId("sign-in-server-url").props.value).toBe(
			"https://cms.example.com",
		);
		expect(getByTestId("sign-in-email").props.value).toBe("you@example.com");
	});

	// the keychain read settles after the screen is already interactive, so a
	// press can flag the Server URL field before the stored value lands in it.
	// the pre-fill takes the same clearing path an edit does, or the field would
	// keep a message contradicting the value it now shows.
	it("clears a stale Server URL message when the stored endpoint arrives", async () => {
		let deliverStored: (stored: string | null) => void = () => {};
		jest.mocked(readLastServerUrl).mockReturnValue(
			new Promise<string | null>((resolve) => {
				deliverStored = resolve;
			}),
		);

		const { getByTestId, queryByTestId } = renderSignInScreen();

		fireEvent.press(getByTestId("sign-in-submit"));
		expect(getByTestId("sign-in-error-server-url", HIDDEN)).toBeTruthy();

		deliverStored("https://cms.example.com");

		await waitFor(() => {
			expect(getByTestId("sign-in-server-url").props.value).toBe(
				"https://cms.example.com",
			);
		});
		expect(queryByTestId("sign-in-error-server-url", HIDDEN)).toBeNull();
		expect(getByTestId("sign-in-server-url").props.accessibilityLabel).toBe(
			"Server URL",
		);
		// the fields the pre-fill says nothing about keep theirs.
		expect(getByTestId("sign-in-error-email", HIDDEN)).toBeTruthy();
	});

	it("submits normalized credentials when the form is valid", async () => {
		// leave the login pending so the assertion targets the credentials handed
		// to the data layer, without driving the success/navigation path.
		leaveLoginPending();

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

	it("disables Sign in only while a submission is in flight", async () => {
		leaveLoginPending();

		const { getByTestId, getByText, queryByTestId } = renderSignInScreen();

		// a spinner beside the working-state label is what makes the disabled
		// button read as working rather than as blocked, so it is only there once
		// something is in flight.
		expect(queryByTestId("sign-in-submit-spinner")).toBeNull();

		fireEvent.changeText(
			getByTestId("sign-in-server-url"),
			"https://cms.example.com",
		);
		fireEvent.changeText(getByTestId("sign-in-email"), "you@example.com");
		fireEvent.changeText(getByTestId("sign-in-password"), "secret");
		fireEvent.press(getByTestId("sign-in-submit"));

		await waitFor(() => {
			expect(getByText("Signing in…")).toBeTruthy();
		});
		expect(getByTestId("sign-in-submit").props.accessibilityState).toEqual({
			disabled: true,
		});
		expect(getByTestId("sign-in-submit-spinner")).toBeTruthy();
	});

	it("maps an auth rejection to a friendly message in the form-level slot", async () => {
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
			expect(
				within(getByTestId("sign-in-error")).getByText(
					"Incorrect email or password.",
				),
			).toBeTruthy();
		});
	});

	it("drops the server's rejection as soon as a field is edited", async () => {
		jest
			.mocked(login)
			.mockRejectedValue(new PayloadRequestError("auth", "rejected", 401));

		const { getByTestId, queryByTestId } = renderSignInScreen();

		fireEvent.changeText(
			getByTestId("sign-in-server-url"),
			"https://cms.example.com",
		);
		fireEvent.changeText(getByTestId("sign-in-email"), "you@example.com");
		fireEvent.changeText(getByTestId("sign-in-password"), "secret");
		fireEvent.press(getByTestId("sign-in-submit"));

		await waitFor(() => {
			expect(getByTestId("sign-in-error")).toBeTruthy();
		});

		fireEvent.changeText(getByTestId("sign-in-password"), "secret2");

		await waitFor(() => {
			expect(queryByTestId("sign-in-error")).toBeNull();
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

	// the stack header clears the top edge, so this screen owns the bottom and
	// the horizontal pair, carried on the scrolled content. Unistyles' jest mock
	// reports zero insets, so this is the zero-inset device: each owned edge has
	// to fall back to its design gutter — the submit button in particular, which
	// is what sits against the home indicator.
	it("keeps the form's gutters when the runtime reports no insets", () => {
		const { getByTestId } = renderSignInScreen();

		const content = StyleSheet.flatten(
			getByTestId("sign-in-screen").props.contentContainerStyle,
		);

		expect(content.paddingBottom).toBe(themes.light.gap.md);
		expect(content.paddingStart).toBe(themes.light.gap.md);
		expect(content.paddingEnd).toBe(themes.light.gap.md);
	});
});
