import { describe, expect, it } from "@jest/globals";
import {
	loginResponseSchema,
	meResponseSchema,
	refreshResponseSchema,
	sessionSchema,
} from "./session";

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
		const session = sessionSchema.parse({
			serverUrl: "https://cms.example.com",
			collectionSlug: "users",
			token: "jwt-token",
			exp: 1_800_000_000,
			user: { id: "1", email: "you@example.com" },
		});

		expect(session.collectionSlug).toBe("users");
	});
});
