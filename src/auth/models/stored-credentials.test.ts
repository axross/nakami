import { describe, expect, it } from "@jest/globals";
import {
	type StoredCredentials,
	storedCredentialsCodec,
	storedCredentialsSchema,
} from "./stored-credentials";

const validCredentials: StoredCredentials = {
	serverUrl: "https://cms.example.com",
	collectionSlug: "users",
	email: "you@example.com",
	password: "password-that-must-not-be-logged",
};

describe("storedCredentialsSchema", () => {
	it.each(["serverUrl", "collectionSlug", "email", "password"] as const)(
		"rejects an empty %s",
		(field) => {
			const result = storedCredentialsSchema.safeParse({
				...validCredentials,
				[field]: "",
			});

			expect(result.success).toBe(false);
			// the issue path, not merely the rejection: without it this passes when
			// some other field in the fixture is what failed.
			expect(result.error?.issues[0]?.path).toEqual([field]);
		},
	);

	// the sign-in form checks only that the field is non-empty, because Payload's
	// `loginWithUsername` lets an auth collection take a username here. a stricter
	// schema would reject a value the form accepted and the server honoured,
	// leaving a working sign-in that cannot be revived.
	it("accepts a username in the email field", () => {
		const result = storedCredentialsSchema.safeParse({
			...validCredentials,
			email: "editor",
		});

		expect(result.success).toBe(true);
	});

	it("strips a field it does not carry", () => {
		const result = storedCredentialsSchema.parse({
			...validCredentials,
			token: "not part of a credential",
		});

		expect(result).toEqual(validCredentials);
	});
});

describe("storedCredentialsCodec", () => {
	it("round-trips a credential unchanged", () => {
		const encoded = storedCredentialsCodec.encode(validCredentials);

		expect(storedCredentialsCodec.decode(encoded)).toEqual(validCredentials);
	});

	// the error travels to the error tracker, so what it must not carry is the
	// stored bytes — which are a password. `JSON.parse`'s own message quotes a
	// fragment of its input, which is exactly why it is not reused here.
	it("names a non-JSON entry without quoting it", () => {
		const result = storedCredentialsCodec.safeDecode(
			"not json at all: hunter2",
		);

		expect(result.success).toBe(false);
		expect(result.error?.issues[0]?.message).toBe(
			"The stored credentials are not valid JSON.",
		);
		expect(JSON.stringify(result.error)).not.toContain("hunter2");
	});

	it("rejects valid JSON of the wrong shape", () => {
		const result = storedCredentialsCodec.safeDecode(
			JSON.stringify({ email: "you@example.com" }),
		);

		expect(result.success).toBe(false);
	});
});
