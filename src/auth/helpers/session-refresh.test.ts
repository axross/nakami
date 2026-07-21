import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Session } from "~/auth/models/session";
import { useAuthStore } from "~/auth/stores/auth-store";
import { PayloadRequestError, refreshToken } from "./payload-client";
import {
	isWithinRefreshWindow,
	REFRESH_LEAD_SECONDS,
	refreshSessionIfDue,
} from "./session-refresh";

jest.mock("~/auth/helpers/session-storage", () => ({
	readSession: jest.fn(async () => null),
	writeSession: jest.fn(async () => undefined),
	clearSession: jest.fn(async () => undefined),
}));

jest.mock("~/auth/helpers/payload-client", () => {
	const actual = jest.requireActual(
		"~/auth/helpers/payload-client",
	) as typeof import("~/auth/helpers/payload-client");
	return { __esModule: true, ...actual, refreshToken: jest.fn() };
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
	});

	it("does nothing when the token is not yet due", async () => {
		useAuthStore.setState({
			status: "authenticated",
			session: sessionExpiringIn(REFRESH_LEAD_SECONDS + 600),
		});

		await refreshSessionIfDue();

		expect(refreshToken).not.toHaveBeenCalled();
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
	});
});
