import { describe, expect, it } from "@jest/globals";
import {
	loginResponseSchema,
	meResponseSchema,
	refreshResponseSchema,
	type Session,
	sessionSchema,
	sessionUserSchema,
	storedSessionCodec,
} from "./session";

const validSession: Session = {
	serverUrl: "https://cms.example.com",
	collectionSlug: "users",
	token: "jwt-token-that-must-not-be-logged",
	exp: 1_800_000_000,
	user: { id: "1", email: "you@example.com" },
};

describe("payloadUserSchema (via loginResponseSchema)", () => {
	it("keeps id and email and strips unknown user fields", () => {
		const result = loginResponseSchema.parse({
			user: {
				id: "abc123",
				email: "you@example.com",
				roles: ["admin"],
				createdAt: "2026-01-01",
			},
			token: "jwt-token",
			exp: 1_800_000_000,
		});

		expect(result.user).toEqual({ id: "abc123", email: "you@example.com" });
	});

	it("normalizes a numeric id to a string", () => {
		const result = loginResponseSchema.parse({
			user: { id: 42, email: "you@example.com" },
			token: "jwt-token",
			exp: 1_800_000_000,
		});

		expect(result.user.id).toBe("42");
	});

	// asserting the issue path, not just the rejection: without it these pass
	// when some other field in the fixture is what failed, which would leave the
	// field this change actually constrains untested.
	it.each(["", "not an email"])("rejects %p as an email", (email) => {
		const result = loginResponseSchema.safeParse({
			user: { id: "1", email },
			token: "jwt-token",
			exp: 1_800_000_000,
		});

		expect(result.success).toBe(false);
		expect(result.error?.issues.map((issue) => issue.path)).toEqual([
			["user", "email"],
		]);
	});

	it("rejects an empty id, which the session's schema would reject too", () => {
		const result = loginResponseSchema.safeParse({
			user: { id: "", email: "you@example.com" },
			token: "jwt-token",
			exp: 1_800_000_000,
		});

		expect(result.success).toBe(false);
		expect(result.error?.issues.map((issue) => issue.path)).toEqual([
			["user", "id"],
		]);
	});
});

describe("sessionUserSchema", () => {
	it("accepts an already-normalized user unchanged", () => {
		expect(
			sessionUserSchema.parse({ id: "1", email: "you@example.com" }),
		).toEqual({ id: "1", email: "you@example.com" });
	});

	it.each(["", "not an email"])("rejects %p as an email", (email) => {
		const result = sessionUserSchema.safeParse({ id: "1", email });

		expect(result.success).toBe(false);
		expect(result.error?.issues.map((issue) => issue.path)).toEqual([
			["email"],
		]);
	});

	it("rejects an empty id", () => {
		const result = sessionUserSchema.safeParse({
			id: "",
			email: "you@example.com",
		});

		expect(result.success).toBe(false);
		expect(result.error?.issues.map((issue) => issue.path)).toEqual([["id"]]);
	});
});

describe("meResponseSchema", () => {
	it("accepts a null user (token no longer valid)", () => {
		const result = meResponseSchema.parse({ user: null });

		expect(result.user).toBeNull();
	});

	it("accepts a user with an optional refreshed token and expiry", () => {
		const result = meResponseSchema.parse({
			user: { id: "1", email: "you@example.com" },
			token: "jwt-token",
			exp: 1_800_000_000,
		});

		expect(result.user?.email).toBe("you@example.com");
		expect(result.token).toBe("jwt-token");
	});
});

describe("refreshResponseSchema", () => {
	it("parses the refreshed token payload", () => {
		const result = refreshResponseSchema.parse({
			user: { id: "1", email: "you@example.com" },
			refreshedToken: "new-token",
			exp: 1_900_000_000,
		});

		expect(result.refreshedToken).toBe("new-token");
	});
});

describe("sessionSchema", () => {
	it("rejects a session missing its token", () => {
		expect(() =>
			sessionSchema.parse({
				serverUrl: "https://cms.example.com",
				collectionSlug: "users",
				exp: 1_800_000_000,
				user: { id: "1", email: "you@example.com" },
			}),
		).toThrow();
	});

	it("parses a complete session", () => {
		const parsed = sessionSchema.parse({
			serverUrl: "https://cms.example.com",
			collectionSlug: "users",
			token: "jwt-token",
			exp: 1_800_000_000,
			user: { id: "1", email: "you@example.com" },
		});

		expect(parsed.collectionSlug).toBe("users");
	});
});

describe("storedSessionCodec", () => {
	it("round-trips a session through its own encode and decode", () => {
		expect(
			storedSessionCodec.decode(storedSessionCodec.encode(validSession)),
		).toEqual(validSession);
	});

	it("decodes an entry the previous build's plain JSON.stringify wrote", () => {
		// the stored shape is unchanged by the move onto the codec, so a session
		// already sitting in a keychain must survive the upgrade.
		expect(storedSessionCodec.decode(JSON.stringify(validSession))).toEqual(
			validSession,
		);
	});

	it("rejects an entry that is not JSON without quoting the stored value", () => {
		const result = storedSessionCodec.safeDecode(
			`${validSession.token}-and-then-some-garbage`,
		);

		expect(result.success).toBe(false);
		// The stored entry carries a bearer token, and this error is reported to
		// the error tracker, so neither the issues nor the message may echo it.
		const serialized = JSON.stringify(result.error?.issues ?? []);
		expect(serialized).not.toContain(validSession.token);
		expect(result.error?.message).not.toContain(validSession.token);
	});

	it("rejects valid JSON that is not a session", () => {
		expect(
			storedSessionCodec.safeDecode(JSON.stringify({ token: "jwt-token" }))
				.success,
		).toBe(false);
	});
});
