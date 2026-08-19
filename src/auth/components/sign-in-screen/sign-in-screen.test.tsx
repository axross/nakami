import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, waitFor, within } from "@testing-library/react-native";
import { renderRouter } from "expo-router/testing-library";
import {
	AccessibilityInfo,
	Platform,
	StyleSheet,
	TextInput,
} from "react-native";
import { readLastServerUrl } from "~/auth/helpers/last-server-url";
import { login, PayloadRequestError } from "~/auth/helpers/payload-client";
import { createTestQueryClient } from "~/common/test-helpers/query-client";
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

/**
 * forgets every focus call recorded so far, so an assertion about the next one
 * cannot be satisfied by an earlier one.
 *
 * defensive rather than load-bearing today. the Collection input carries
 * `autoFocus`, but that is a native prop this preset's render-only `TextInput`
 * mock never acts on, so revealing the field records no focus call — and these
 * assertions should not quietly depend on that staying true.
 */
function forgetFocusCalls(): void {
	const { focus } = TextInput.prototype as unknown as {
		focus: { mockClear: () => void };
	};

	focus.mockClear();
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

	// the hints are what a password manager reads the form through, and on
	// Android a field carrying none is opted out of autofill outright. React
	// Native maps this one prop to both platforms, so these values are the whole
	// of what the form declares.
	it("hints each input at what it holds", () => {
		const { getByTestId } = renderSignInScreen();

		// this suite runs as iOS, which is the platform the URL hint is guarded
		// to; on Android the same expression leaves the field unhinted.
		expect(getByTestId("sign-in-server-url").props.autoComplete).toBe("url");
		expect(getByTestId("sign-in-email").props.autoComplete).toBe("username");
		expect(getByTestId("sign-in-password").props.autoComplete).toBe(
			"current-password",
		);
	});

	// the URL hint is the change's one platform-conditional value, and this suite
	// runs as iOS — so without this, dropping the guard would keep every other
	// test green while sending Android a value it has no mapping for, which it
	// answers by logging `Invalid autoComplete: url` and disabling autofill on
	// the field.
	it("leaves the Server URL unhinted on Android, which has no URL hint", () => {
		// restored by hand in `finally` rather than through `jest.restoreAllMocks`,
		// which would also restore the module-scope `announceSpy` and leave every
		// announcement assertion after this one recording nothing. this suite's
		// `beforeEach` clears calls; it does not restore replacements.
		const platform = jest.replaceProperty(Platform, "OS", "android");

		try {
			const { getByTestId } = renderSignInScreen();

			expect(
				getByTestId("sign-in-server-url").props.autoComplete,
			).toBeUndefined();
			// the credential pair is cross-platform and stays hinted either way.
			expect(getByTestId("sign-in-email").props.autoComplete).toBe("username");
		} finally {
			platform.restore();
		}
	});

	// a slug is not an account name, and an unhinted field beside the credential
	// pair is what invites a provider to offer one into it.
	it("keeps the Collection input out of autofill once it is revealed", () => {
		const { getByTestId } = renderSignInScreen();

		fireEvent.press(getByTestId("sign-in-collection-edit"));

		expect(getByTestId("sign-in-collection-input").props.autoComplete).toBe(
			"off",
		);
	});

	it("moves the return key from Server URL past a Collection showing text", () => {
		const { getByTestId } = renderSignInScreen();

		fireEvent(getByTestId("sign-in-server-url"), "submitEditing");

		expect(lastFocusedTestId()).toBe("sign-in-email");
	});

	it("moves the return key from Server URL to a Collection being edited", () => {
		const { getByTestId } = renderSignInScreen();

		fireEvent.press(getByTestId("sign-in-collection-edit"));
		forgetFocusCalls();

		fireEvent(getByTestId("sign-in-server-url"), "submitEditing");

		expect(lastFocusedTestId()).toBe("sign-in-collection-input");
	});

	it("moves the return key from the Collection input to Email", () => {
		const { getByTestId } = renderSignInScreen();

		fireEvent.press(getByTestId("sign-in-collection-edit"));
		forgetFocusCalls();

		fireEvent(getByTestId("sign-in-collection-input"), "submitEditing");

		expect(lastFocusedTestId()).toBe("sign-in-email");
	});

	it("moves the return key from Email to Password", () => {
		const { getByTestId } = renderSignInScreen();

		fireEvent(getByTestId("sign-in-email"), "submitEditing");

		expect(lastFocusedTestId()).toBe("sign-in-password");
	});

	// the return key's own configuration, asserted on each input rather than
	// through a fired event, and for two reasons. the key's label and the fact
	// that it does not blur are only ever observable as props. and the handler
	// is pinned to the input itself, because `fireEvent` walks up to find one
	// when the element carries none: no ancestor here holds `onSubmitEditing`
	// today, so the chain tests above would catch a field that dropped it — but
	// they would stop catching it the moment one did, and this assertion is what
	// keeps that from passing silently.
	it("gives each input a return key that carries the chain", () => {
		const { getByTestId } = renderSignInScreen();

		fireEvent.press(getByTestId("sign-in-collection-edit"));

		for (const testID of [
			"sign-in-server-url",
			"sign-in-collection-input",
			"sign-in-email",
			"sign-in-password",
		]) {
			expect(typeof getByTestId(testID).props.onSubmitEditing).toBe("function");
		}

		// `submit` is what leaves the keyboard up between fields; the default
		// blurs first, closing it and reopening it on the next one.
		for (const testID of [
			"sign-in-server-url",
			"sign-in-collection-input",
			"sign-in-email",
		]) {
			expect(getByTestId(testID).props.returnKeyType).toBe("next");
			expect(getByTestId(testID).props.submitBehavior).toBe("submit");
		}

		// the last field submits instead of advancing, so it keeps the default:
		// no field is left to move to, and dismissing the keyboard is what the
		// user wants next.
		expect(getByTestId("sign-in-password").props.returnKeyType).toBe("go");
		expect(
			getByTestId("sign-in-password").props.submitBehavior,
		).toBeUndefined();
	});

	// the Password field's return key and the Sign in button share one callback,
	// so these two assert the shared path rather than a second one beside it.
	it("submits from the Password field's return key", async () => {
		leaveLoginPending();

		const { getByTestId } = renderSignInScreen();

		fireEvent.changeText(
			getByTestId("sign-in-server-url"),
			"https://cms.example.com",
		);
		fireEvent.changeText(getByTestId("sign-in-email"), "you@example.com");
		fireEvent.changeText(getByTestId("sign-in-password"), "secret");
		fireEvent(getByTestId("sign-in-password"), "submitEditing");

		await waitFor(() => {
			expect(login).toHaveBeenCalledWith(
				{ serverUrl: "https://cms.example.com", collectionSlug: "users" },
				{ email: "you@example.com", password: "secret" },
			);
		});
	});

	it("validates from the Password field's return key as a press does", () => {
		const { getByTestId } = renderSignInScreen();

		fireEvent(getByTestId("sign-in-password"), "submitEditing");

		expect(
			within(getByTestId("sign-in-error-summary")).getByText(
				"3 problems to fix",
			),
		).toBeTruthy();
		expect(announceSpy).toHaveBeenCalledWith("3 problems to fix", {
			queue: true,
		});
		expect(login).not.toHaveBeenCalled();
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

	// the button carries a `disabled` state and the Password field's Go key has
	// none, so the in-flight gate has to sit in the callback they share. without
	// it, returning to the field and pressing Go again would start a second
	// sign-in over the first — another login POST and another keychain write.
	it("ignores a second Go while a submission is already in flight", async () => {
		leaveLoginPending();

		const { getByTestId, getByText } = renderSignInScreen();

		fireEvent.changeText(
			getByTestId("sign-in-server-url"),
			"https://cms.example.com",
		);
		fireEvent.changeText(getByTestId("sign-in-email"), "you@example.com");
		fireEvent.changeText(getByTestId("sign-in-password"), "secret");

		fireEvent(getByTestId("sign-in-password"), "submitEditing");

		await waitFor(() => {
			expect(getByText("Signing in…")).toBeTruthy();
		});

		fireEvent(getByTestId("sign-in-password"), "submitEditing");
		fireEvent.press(getByTestId("sign-in-submit"));

		// drained before counting, because `mutate` reaches its mutation function
		// on a later tick: counting synchronously here would read 1 even when a
		// second sign-in had in fact started, and the assertion would hold with
		// the guard taken out.
		await act(async () => {});

		expect(login).toHaveBeenCalledTimes(1);
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
