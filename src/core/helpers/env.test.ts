import { describe, expect, it } from "@jest/globals";
import { envSchema } from "./env";

describe("envSchema", () => {
	it("accepts an empty environment", () => {
		expect(envSchema.parse({})).toEqual({});
	});

	it("accepts a valid Sentry DSN URL", () => {
		expect(
			envSchema.parse({
				EXPO_PUBLIC_SENTRY_DSN: "https://key@o0.ingest.sentry.io/0",
			}),
		).toEqual({
			EXPO_PUBLIC_SENTRY_DSN: "https://key@o0.ingest.sentry.io/0",
		});
	});

	it("rejects a malformed Sentry DSN", () => {
		expect(() =>
			envSchema.parse({ EXPO_PUBLIC_SENTRY_DSN: "not-a-url" }),
		).toThrow();
	});
});
