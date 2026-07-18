import { z } from "zod";

export const envSchema = z.object({
	EXPO_PUBLIC_SENTRY_DSN: z.url().optional(),
});

export const env = envSchema.parse({
	EXPO_PUBLIC_SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN || undefined,
});
