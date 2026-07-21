import { z } from "zod";

/**
 * A Payload user as the app needs it. Payload auth collections carry many more
 * fields; we keep only what the UI shows and tolerate (strip) the rest so the
 * app works against any collection shape. `id` is a string or number depending
 * on the database adapter, normalized to a string.
 */
export const payloadUserSchema = z.object({
	id: z.union([z.string(), z.number()]).transform(String),
	email: z.string(),
});

export type PayloadUser = z.infer<typeof payloadUserSchema>;

/** `POST /api/{collection}/login` success payload. */
export const loginResponseSchema = z.object({
	user: payloadUserSchema,
	token: z.string().min(1),
	exp: z.number(),
});

/**
 * `GET /api/{collection}/me` payload. Payload returns `user: null` (with 200)
 * when the token is no longer valid, so `user` is nullable and the caller
 * treats a null user as a rejected session.
 */
export const meResponseSchema = z.object({
	user: payloadUserSchema.nullable(),
	token: z.string().min(1).optional(),
	exp: z.number().optional(),
});

/** `POST /api/{collection}/refresh-token` success payload. */
export const refreshResponseSchema = z.object({
	user: payloadUserSchema,
	refreshedToken: z.string().min(1),
	exp: z.number(),
});

/**
 * The persisted session. Stored as a single JSON value in the platform
 * keychain (never the database or plain storage). `exp` is the token's Unix
 * expiry in seconds, as returned by Payload.
 */
export const sessionSchema = z.object({
	serverUrl: z.string().min(1),
	collectionSlug: z.string().min(1),
	token: z.string().min(1),
	exp: z.number(),
	user: payloadUserSchema,
});

export type Session = z.infer<typeof sessionSchema>;
