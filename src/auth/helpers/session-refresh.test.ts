import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Session } from "~/auth/models/session";
import { useAuthStore } from "~/auth/stores/auth-store";
import { addBreadcrumb } from "~/core/helpers/error-reporting";
import { readCredentials } from "./credentials-storage";
import { login, PayloadRequestError, refreshToken } from "./payload-client";
import {
	isWithinRefreshWindow,
	REFRESH_LEAD_SECONDS,
	refreshSessionIfDue,
} from "./session-refresh";

// assert the log lines through the breadcrumb transport rather than the logger:
// reaching the error tracker's trail is the point of these lines, and it is the
// same seam `core/helpers/logging.test.ts` asserts against.
jest.mock("~/core/helpers/error-reporting");

jest.mock("~/auth/helpers/session-storage", () => ({
	readSession: jest.fn(async () => null),
	writeSession: jest.fn(async () => undefined),
	clearSession: jest.fn(async () => undefined),
}));

// a rejected token now reaches the store's `reauthenticate`, which asks this
// module first. the default is a user who declined the consent dialog, so every
// case below behaves as it did before credentials existed unless it says
// otherwise.
jest.mock("~/auth/helpers/credentials-storage", () => ({
	readCredentials: jest.fn(async () => null),
	writeCredentials: jest.fn(async () => undefined),
	clearCredentials: jest.fn(async () => undefined),
}));

jest.mock("~/auth/helpers/payload-client", () => {
	const actual = jest.requireActual(
		"~/auth/helpers/payload-client",
	) as typeof import("~/auth/helpers/payload-client");
	return {
		__esModule: true,
		...actual,
		login: jest.fn(),
		refreshToken: jest.fn(),
	};
});

function sessionExpiringIn(seconds: number): Session {
	return {
		serverUrl: "https://cms.example.com",
		collectionSlug: "users",
		token: "current-token",
		exp: Math.floor(Date.now() / 1000) + seconds,
		user: { id: "1", email: "you@example.com" },
	};
}

/**
 * the breadcrumbs this module emitted, in order. filtering by category keeps
 * the assertions to `refreshSessionIfDue`'s own bracket, so the store's
 * transition lines do not count toward it.
 */
function refreshBreadcrumbs() {
	return jest
		.mocked(addBreadcrumb)
		.mock.calls.map(([breadcrumb]) => breadcrumb)
		.filter((breadcrumb) => breadcrumb.category === "auth/session-refresh");
}

beforeEach(() => {
	jest.clearAllMocks();
	useAuthStore.setState({ status: "loading", session: null });
});

describe("isWithinRefreshWindow", () => {
	const now = 1_800_000_000_000;
	const nowSeconds = Math.floor(now / 1000);

	it("is false when the token is comfortably in the future", () => {
		expect(
			isWithinRefreshWindow(nowSeconds + REFRESH_LEAD_SECONDS + 60, now),
		).toBe(false);
	});

	it("is true once inside the lead window", () => {
		expect(
			isWithinRefreshWindow(nowSeconds + REFRESH_LEAD_SECONDS - 60, now),
		).toBe(true);
	});

	it("is true for an already-expired token", () => {
		expect(isWithinRefreshWindow(nowSeconds - 60, now)).toBe(true);
	});
});

describe("refreshSessionIfDue", () => {
	it("does nothing without a session", async () => {
		await refreshSessionIfDue();

		expect(refreshToken).not.toHaveBeenCalled();
		// a no-op tick stays silent: the bracket opens after the due check, so a
		// signed-out app does not fill the breadcrumb trail with interval noise.
		expect(refreshBreadcrumbs()).toEqual([]);
	});

	it("does nothing when the token is not yet due", async () => {
		useAuthStore.setState({
			status: "authenticated",
			session: sessionExpiringIn(REFRESH_LEAD_SECONDS + 600),
		});

		await refreshSessionIfDue();

		expect(refreshToken).not.toHaveBeenCalled();
		expect(refreshBreadcrumbs()).toEqual([]);
	});

	it("refreshes and applies the new token when due", async () => {
		useAuthStore.setState({
			status: "authenticated",
			session: sessionExpiringIn(60),
		});
		jest.mocked(refreshToken).mockResolvedValue({
			user: { id: "1", email: "you@example.com" },
			refreshedToken: "fresh-token",
			exp: Math.floor(Date.now() / 1000) + 7200,
		});

		await refreshSessionIfDue();

		expect(useAuthStore.getState().session?.token).toBe("fresh-token");
		expect(refreshBreadcrumbs()).toEqual([
			{
				message: "Started refreshing the session token.",
				category: "auth/session-refresh",
				level: "debug",
				data: { serverUrl: "https://cms.example.com" },
			},
			{
				message: "Completed refreshing the session token.",
				category: "auth/session-refresh",
				level: "info",
				data: { outcome: "refreshed", duration: expect.any(Number) },
			},
		]);
	});

	it("signs out when the refresh is rejected", async () => {
		useAuthStore.setState({
			status: "authenticated",
			session: sessionExpiringIn(60),
		});
		jest
			.mocked(refreshToken)
			.mockRejectedValue(new PayloadRequestError("auth", "rejected", 401));

		await refreshSessionIfDue();

		expect(useAuthStore.getState().status).toBe("unauthenticated");
	});

	// the line that makes an involuntary sign-out attributable from the
	// breadcrumb trail alone — without it the app just drops to the welcome
	// screen with nothing saying why.
	it("brackets the refresh and attributes the sign-out when the token is rejected", async () => {
		useAuthStore.setState({
			status: "authenticated",
			session: sessionExpiringIn(60),
		});
		jest
			.mocked(refreshToken)
			.mockRejectedValue(new PayloadRequestError("auth", "rejected", 401));

		await refreshSessionIfDue();

		expect(refreshBreadcrumbs()).toEqual([
			{
				message: "Started refreshing the session token.",
				category: "auth/session-refresh",
				level: "debug",
				data: { serverUrl: "https://cms.example.com" },
			},
			{
				message: "Completed refreshing the session token.",
				category: "auth/session-refresh",
				level: "info",
				data: {
					outcome: "signed-out",
					reason: "token-rejected",
					duration: expect.any(Number),
				},
			},
		]);
	});

	// the whole point of the feature, at the trigger that fires while the app is
	// open: the token is gone, and the user never sees it happen.
	it("re-authenticates rather than signing out when credentials were kept", async () => {
		useAuthStore.setState({
			status: "authenticated",
			session: sessionExpiringIn(60),
		});
		jest
			.mocked(refreshToken)
			.mockRejectedValue(new PayloadRequestError("auth", "rejected", 401));
		jest.mocked(readCredentials).mockResolvedValue({
			serverUrl: "https://cms.example.com",
			collectionSlug: "users",
			email: "you@example.com",
			password: "password-that-must-not-be-logged",
		});
		jest.mocked(login).mockResolvedValue({
			user: { id: "1", email: "you@example.com" },
			token: "reissued-token",
			exp: Math.floor(Date.now() / 1000) + 7200,
		});

		await refreshSessionIfDue();

		expect(useAuthStore.getState().status).toBe("authenticated");
		expect(useAuthStore.getState().session?.token).toBe("reissued-token");
		// the bracket closes on what actually happened rather than on the
		// `signed-out` this branch used to write unconditionally.
		expect(refreshBreadcrumbs().at(-1)).toEqual({
			message: "Completed refreshing the session token.",
			category: "auth/session-refresh",
			level: "info",
			data: {
				outcome: "reauthenticated",
				reason: "token-rejected",
				duration: expect.any(Number),
			},
		});
	});

	it("keeps the session when the refresh is unreachable", async () => {
		useAuthStore.setState({
			status: "authenticated",
			session: sessionExpiringIn(60),
		});
		jest
			.mocked(refreshToken)
			.mockRejectedValue(new PayloadRequestError("network", "unreachable"));

		await refreshSessionIfDue();

		expect(useAuthStore.getState().status).toBe("authenticated");
		expect(useAuthStore.getState().session?.token).toBe("current-token");
		expect(refreshBreadcrumbs()).toEqual([
			{
				message: "Started refreshing the session token.",
				category: "auth/session-refresh",
				level: "debug",
				data: { serverUrl: "https://cms.example.com" },
			},
			{
				message: "Completed refreshing the session token.",
				category: "auth/session-refresh",
				level: "warning",
				data: {
					outcome: "deferred",
					reason: "unreachable",
					duration: expect.any(Number),
				},
			},
		]);
	});

	it("keeps credentials out of every breadcrumb it emits", async () => {
		useAuthStore.setState({
			status: "authenticated",
			session: sessionExpiringIn(60),
		});
		jest
			.mocked(refreshToken)
			.mockRejectedValue(new PayloadRequestError("auth", "rejected", 401));

		await refreshSessionIfDue();

		// every line here becomes a breadcrumb shipped off-device, so assert
		// across all of them — the store's transition lines included. assert the
		// trail is non-empty first, so an implementation that stopped logging
		// entirely cannot satisfy the two `not.toContain`s vacuously.
		const calls = jest.mocked(addBreadcrumb).mock.calls;
		expect(calls.length).toBeGreaterThan(0);

		const emitted = JSON.stringify(calls);
		expect(emitted).not.toContain("current-token");
		expect(emitted).not.toContain("you@example.com");
	});
});
