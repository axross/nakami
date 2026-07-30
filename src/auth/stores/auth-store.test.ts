import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { writeLastServerUrl } from "~/auth/helpers/last-server-url";
import { fetchMe, PayloadRequestError } from "~/auth/helpers/payload-client";
import {
	clearSession,
	readSession,
	writeSession,
} from "~/auth/helpers/session-storage";
import type { Session } from "~/auth/models/session";
import { getSessionQueryKeyRoot } from "~/common/helpers/session-query-key";
import { queryClient } from "~/core/helpers/query-client";
import { useAuthStore } from "./auth-store";

jest.mock("~/auth/helpers/session-storage", () => ({
	readSession: jest.fn(),
	writeSession: jest.fn(async () => undefined),
	clearSession: jest.fn(async () => undefined),
}));

jest.mock("~/auth/helpers/last-server-url", () => ({
	writeLastServerUrl: jest.fn(async () => undefined),
}));

jest.mock("~/auth/helpers/payload-client", () => {
	const actual = jest.requireActual(
		"~/auth/helpers/payload-client",
	) as typeof import("~/auth/helpers/payload-client");
	return { __esModule: true, ...actual, fetchMe: jest.fn() };
});

const session: Session = {
	serverUrl: "https://cms.example.com",
	collectionSlug: "users",
	token: "stored-token",
	exp: 1_800_000_000,
	user: { id: "1", email: "you@example.com" },
};

beforeEach(() => {
	jest.clearAllMocks();
	queryClient.clear();
	useAuthStore.setState({ status: "loading", session: null });
});

describe("hydrate", () => {
	it("lands unauthenticated when no session is stored", async () => {
		jest.mocked(readSession).mockResolvedValue(null);

		await useAuthStore.getState().hydrate();

		expect(useAuthStore.getState().status).toBe("unauthenticated");
		expect(useAuthStore.getState().session).toBeNull();
	});

	it("stays authenticated and reconciles the token when /me confirms the session", async () => {
		jest.mocked(readSession).mockResolvedValue(session);
		jest.mocked(fetchMe).mockResolvedValue({
			user: { id: "1", email: "you@example.com" },
			token: "reconciled-token",
			exp: 1_900_000_000,
		});

		await useAuthStore.getState().hydrate();

		expect(useAuthStore.getState().status).toBe("authenticated");
		expect(useAuthStore.getState().session?.token).toBe("reconciled-token");
		expect(writeSession).toHaveBeenCalled();
	});

	it("signs out when /me reports a null user", async () => {
		jest.mocked(readSession).mockResolvedValue(session);
		jest.mocked(fetchMe).mockResolvedValue({ user: null });

		await useAuthStore.getState().hydrate();

		expect(useAuthStore.getState().status).toBe("unauthenticated");
		expect(clearSession).toHaveBeenCalled();
	});

	it("signs out when /me rejects the token", async () => {
		jest.mocked(readSession).mockResolvedValue(session);
		jest
			.mocked(fetchMe)
			.mockRejectedValue(new PayloadRequestError("auth", "rejected", 401));

		await useAuthStore.getState().hydrate();

		expect(useAuthStore.getState().status).toBe("unauthenticated");
		expect(clearSession).toHaveBeenCalled();
	});

	it("keeps the stored session when /me is unreachable (offline-tolerant)", async () => {
		jest.mocked(readSession).mockResolvedValue(session);
		jest
			.mocked(fetchMe)
			.mockRejectedValue(new PayloadRequestError("network", "unreachable"));

		await useAuthStore.getState().hydrate();

		expect(useAuthStore.getState().status).toBe("authenticated");
		expect(useAuthStore.getState().session?.token).toBe("stored-token");
		expect(clearSession).not.toHaveBeenCalled();
	});
});

describe("authenticate / deauthenticate / applyRefresh", () => {
	it("persists the session and remembers the server URL on authenticate", async () => {
		await useAuthStore.getState().authenticate(session);

		expect(useAuthStore.getState().status).toBe("authenticated");
		expect(writeSession).toHaveBeenCalledWith(session);
		expect(writeLastServerUrl).toHaveBeenCalledWith(session.serverUrl);
	});

	it("clears the session but keeps the remembered server URL on deauthenticate", async () => {
		useAuthStore.setState({ status: "authenticated", session });

		await useAuthStore.getState().deauthenticate();

		expect(useAuthStore.getState().status).toBe("unauthenticated");
		expect(useAuthStore.getState().session).toBeNull();
		expect(clearSession).toHaveBeenCalled();
		// The last-used URL survives sign-out, so nothing clears it here.
		expect(writeLastServerUrl).not.toHaveBeenCalled();
	});

	it("evicts the ending session's cached server state, and only that session's", async () => {
		useAuthStore.setState({ status: "authenticated", session });
		queryClient.setQueryData(
			[...getSessionQueryKeyRoot(session.user.id), "collections"],
			[{ slug: "posts", label: "Posts" }],
		);
		queryClient.setQueryData(
			[...getSessionQueryKeyRoot("someone-else"), "collections"],
			[{ slug: "media", label: "Media" }],
		);

		await useAuthStore.getState().deauthenticate();

		expect(
			queryClient.getQueryData([
				...getSessionQueryKeyRoot(session.user.id),
				"collections",
			]),
		).toBeUndefined();
		expect(
			queryClient.getQueryData([
				...getSessionQueryKeyRoot("someone-else"),
				"collections",
			]),
		).toEqual([{ slug: "media", label: "Media" }]);
	});

	it("replaces the token and expiry on applyRefresh", async () => {
		useAuthStore.setState({ status: "authenticated", session });

		await useAuthStore
			.getState()
			.applyRefresh("refreshed-token", 2_000_000_000);

		expect(useAuthStore.getState().session?.token).toBe("refreshed-token");
		expect(useAuthStore.getState().session?.exp).toBe(2_000_000_000);
		expect(writeSession).toHaveBeenCalled();
	});
});
