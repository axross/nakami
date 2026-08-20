import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import {
	clearCredentials,
	readCredentials,
	writeCredentials,
} from "~/auth/helpers/credentials-storage";
import { writeLastServerUrl } from "~/auth/helpers/last-server-url";
import {
	fetchMe,
	login,
	PayloadRequestError,
} from "~/auth/helpers/payload-client";
import {
	clearSession,
	readSession,
	writeSession,
} from "~/auth/helpers/session-storage";
import type { Session } from "~/auth/models/session";
import type { StoredCredentials } from "~/auth/models/stored-credentials";
import { getSessionQueryKeyRoot } from "~/common/helpers/session-query-key";
import { addBreadcrumb } from "~/core/helpers/error-reporting";
import { queryClient } from "~/core/helpers/query-client";
import { useAuthStore } from "./auth-store";

// assert the log lines through the breadcrumb transport rather than the logger:
// reaching the error tracker's trail is the point of these lines, and it is
// also what carries them off the device — which is what makes the guard below
// worth having.
jest.mock("~/core/helpers/error-reporting");

jest.mock("~/auth/helpers/session-storage", () => ({
	readSession: jest.fn(),
	writeSession: jest.fn(async () => undefined),
	clearSession: jest.fn(async () => undefined),
}));

jest.mock("~/auth/helpers/credentials-storage", () => ({
	readCredentials: jest.fn(async () => null),
	writeCredentials: jest.fn(async () => undefined),
	clearCredentials: jest.fn(async () => undefined),
}));

jest.mock("~/auth/helpers/last-server-url", () => ({
	writeLastServerUrl: jest.fn(async () => undefined),
}));

jest.mock("~/auth/helpers/payload-client", () => {
	const actual = jest.requireActual(
		"~/auth/helpers/payload-client",
	) as typeof import("~/auth/helpers/payload-client");
	return { __esModule: true, ...actual, fetchMe: jest.fn(), login: jest.fn() };
});

// `deauthenticate()` hard-imports the app's one query client, so substitute a
// test client for it rather than letting this suite mutate the instance the
// rest of the app shares. the store's real eviction logic still runs.
jest.mock("~/core/helpers/query-client", () => {
	const { createTestQueryClient } = jest.requireActual(
		"~/common/test-helpers/query-client",
	) as typeof import("~/common/test-helpers/query-client");
	return { __esModule: true, queryClient: createTestQueryClient() };
});

const session: Session = {
	serverUrl: "https://cms.example.com",
	collectionSlug: "users",
	token: "stored-token",
	exp: 1_800_000_000,
	user: { id: "1", email: "you@example.com" },
};

const credentials: StoredCredentials = {
	serverUrl: "https://cms.example.com",
	collectionSlug: "users",
	email: "you@example.com",
	password: "password-that-must-not-be-logged",
};

/** arranges a stored credential the store can replay. */
function storedCredentials(): void {
	jest.mocked(readCredentials).mockResolvedValue(credentials);
}

beforeEach(() => {
	jest.clearAllMocks();
	// the substituted client lives for the file, so empty it between tests.
	queryClient.clear();
	// the default is a user who declined the consent dialog, which is the state
	// every path here behaved in before credentials existed. a test that is about
	// the credentials says so with `storedCredentials()`.
	jest.mocked(readCredentials).mockResolvedValue(null);
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

	// credentials never outlive the session they were stored beside. `authenticate`
	// writes the session first, so a crash between the two writes can leave one
	// orphaned — and on iOS a keychain entry survives the app's uninstall, so a
	// reinstall meets one too.
	it("clears orphaned credentials when no session is stored", async () => {
		jest.mocked(readSession).mockResolvedValue(null);

		await useAuthStore.getState().hydrate();

		expect(clearCredentials).toHaveBeenCalled();
	});

	it("re-authenticates instead of signing out when /me reports a null user", async () => {
		jest.mocked(readSession).mockResolvedValue(session);
		jest.mocked(fetchMe).mockResolvedValue({ user: null });
		storedCredentials();
		jest.mocked(login).mockResolvedValue({
			user: { id: "1", email: "you@example.com" },
			token: "reissued-token",
			exp: 1_900_000_000,
		});

		await useAuthStore.getState().hydrate();

		expect(useAuthStore.getState().status).toBe("authenticated");
		expect(useAuthStore.getState().session?.token).toBe("reissued-token");
		expect(clearSession).not.toHaveBeenCalled();
	});

	it("re-authenticates instead of signing out when /me rejects the token", async () => {
		jest.mocked(readSession).mockResolvedValue(session);
		jest
			.mocked(fetchMe)
			.mockRejectedValue(new PayloadRequestError("auth", "rejected", 401));
		storedCredentials();
		jest.mocked(login).mockResolvedValue({
			user: { id: "1", email: "you@example.com" },
			token: "reissued-token",
			exp: 1_900_000_000,
		});

		await useAuthStore.getState().hydrate();

		expect(useAuthStore.getState().status).toBe("authenticated");
		expect(useAuthStore.getState().session?.token).toBe("reissued-token");
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

describe("reauthenticate", () => {
	it("signs out when nothing was stored to sign in with", async () => {
		useAuthStore.setState({ status: "authenticated", session });

		await expect(useAuthStore.getState().reauthenticate()).resolves.toBe(
			"signed-out",
		);

		expect(useAuthStore.getState().status).toBe("unauthenticated");
		expect(login).not.toHaveBeenCalled();
		expect(clearSession).toHaveBeenCalled();
	});

	it("replays the stored credentials and keeps the session alive", async () => {
		useAuthStore.setState({ status: "authenticated", session });
		storedCredentials();
		jest.mocked(login).mockResolvedValue({
			user: { id: "1", email: "you@example.com" },
			token: "reissued-token",
			exp: 1_900_000_000,
		});

		await expect(useAuthStore.getState().reauthenticate()).resolves.toBe(
			"reauthenticated",
		);

		expect(login).toHaveBeenCalledWith(
			{
				serverUrl: credentials.serverUrl,
				collectionSlug: credentials.collectionSlug,
			},
			{ email: credentials.email, password: credentials.password },
		);
		expect(useAuthStore.getState().status).toBe("authenticated");
		expect(useAuthStore.getState().session?.token).toBe("reissued-token");
		expect(useAuthStore.getState().session?.exp).toBe(1_900_000_000);
		expect(writeSession).toHaveBeenCalled();
		expect(clearCredentials).not.toHaveBeenCalled();
	});

	// terminal, and deliberately not retried: a password that no longer opens the
	// account would otherwise be replayed on every trigger and walk the account
	// into Payload's `maxLoginAttempts` lockout.
	it("discards the credentials and signs out when the server refuses them", async () => {
		useAuthStore.setState({ status: "authenticated", session });
		storedCredentials();
		jest
			.mocked(login)
			.mockRejectedValue(new PayloadRequestError("auth", "rejected", 401));

		await expect(useAuthStore.getState().reauthenticate()).resolves.toBe(
			"signed-out",
		);

		expect(useAuthStore.getState().status).toBe("unauthenticated");
		expect(clearCredentials).toHaveBeenCalled();
		expect(login).toHaveBeenCalledTimes(1);
	});

	// this module now handles a password, and every line it writes is mirrored to
	// the error tracker's breadcrumb trail — so a log context that named the
	// email or the password would carry both off the device. asserted across all
	// three outcomes at once, since each writes its own line.
	it.each([
		[
			"reauthenticated",
			() => {
				jest.mocked(login).mockResolvedValue({
					user: { id: "1", email: "you@example.com" },
					token: "reissued-token",
					exp: 1_900_000_000,
				});
			},
		],
		[
			"signed-out",
			() => {
				jest
					.mocked(login)
					.mockRejectedValue(new PayloadRequestError("auth", "rejected", 401));
			},
		],
		[
			"deferred",
			() => {
				jest
					.mocked(login)
					.mockRejectedValue(new PayloadRequestError("network", "unreachable"));
			},
		],
	])("keeps the credentials out of every %s breadcrumb", async (_, arrange) => {
		useAuthStore.setState({ status: "authenticated", session });
		storedCredentials();
		arrange();

		await useAuthStore.getState().reauthenticate();

		const emitted = JSON.stringify(
			jest.mocked(addBreadcrumb).mock.calls.map(([breadcrumb]) => breadcrumb),
		);
		expect(emitted).not.toContain(credentials.password);
		expect(emitted).not.toContain(credentials.email);
		// the endpoint is what a line here may name, so this is also the assertion
		// that the trail is not simply empty.
		expect(emitted).toContain(credentials.serverUrl);
	});

	// an unreachable server says nothing about validity, so neither does this:
	// discarding a working credential here would sign a user out for having been
	// offline at the wrong moment.
	it("keeps both the session and the credentials when the server is unreachable", async () => {
		useAuthStore.setState({ status: "authenticated", session });
		storedCredentials();
		jest
			.mocked(login)
			.mockRejectedValue(new PayloadRequestError("network", "unreachable"));

		await expect(useAuthStore.getState().reauthenticate()).resolves.toBe(
			"deferred",
		);

		expect(useAuthStore.getState().status).toBe("authenticated");
		expect(useAuthStore.getState().session).toEqual(session);
		expect(clearCredentials).not.toHaveBeenCalled();
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

	it("writes nothing extra when the consent dialog was declined", async () => {
		await useAuthStore.getState().authenticate(session);

		expect(writeCredentials).not.toHaveBeenCalled();
	});

	it("keeps the credentials alongside the session when the dialog allowed it", async () => {
		await useAuthStore.getState().authenticate(session, credentials);

		expect(writeCredentials).toHaveBeenCalledWith(credentials);
	});

	// the order is what makes a failure between the two writes recoverable: a
	// session with no credentials is today's behaviour, while a password with no
	// session is one nothing would ever read.
	it("writes the session before the credentials", async () => {
		await useAuthStore.getState().authenticate(session, credentials);

		expect(
			jest.mocked(writeSession).mock.invocationCallOrder[0] ?? Number.NaN,
		).toBeLessThan(
			jest.mocked(writeCredentials).mock.invocationCallOrder[0] ?? Number.NaN,
		);
	});

	it("clears the session but keeps the remembered server URL on deauthenticate", async () => {
		useAuthStore.setState({ status: "authenticated", session });

		await useAuthStore.getState().deauthenticate();

		expect(useAuthStore.getState().status).toBe("unauthenticated");
		expect(useAuthStore.getState().session).toBeNull();
		expect(clearSession).toHaveBeenCalled();
		// the last-used URL survives sign-out, so nothing clears it here.
		expect(writeLastServerUrl).not.toHaveBeenCalled();
	});

	// nothing else clears them, which is what makes signing out the way to take
	// back the consent the dialog asked for.
	it("clears the stored credentials on deauthenticate", async () => {
		useAuthStore.setState({ status: "authenticated", session });

		await useAuthStore.getState().deauthenticate();

		expect(clearCredentials).toHaveBeenCalled();
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
