import { z } from "zod";

/**
 * a user id in its normalized, in-app form. shared by both user schemas below
 * so the network side cannot produce an id the domain side would reject.
 */
const userIdSchema = z.string().min(1);

/**
 * a Payload user as it arrives over the network. Payload auth collections carry
 * many more fields; we keep only what the UI shows and tolerate (strip) the
 * rest so the app works against any collection shape. `id` is a string or a
 * number depending on the database adapter, and this is the one place it is
 * normalized to a string.
 */
export const payloadUserSchema = z.object({
	id: z.union([userIdSchema, z.number()]).transform(String),
	email: z.email(),
});

/**
 * the same user once it is inside the app, where `id` is already a string. the
 * absence of a transform is the point rather than an omission: a `.transform()`
 * anywhere inside a schema makes `encode` throw, so keeping one here would make
 * {@link storedSessionCodec} unusable and leave the keychain's write half
 * bypassing the schema its read half re-runs. it infers the same
 * `{ id: string; email: string }` as {@link payloadUserSchema}, so the two are
 * interchangeable to every consumer.
 */
export const sessionUserSchema = z.object({
	id: userIdSchema,
	email: z.email(),
});

export type PayloadUser = z.infer<typeof sessionUserSchema>;

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
 * the persisted session. stored as a single JSON value in the platform
 * keychain (never the database or plain storage), through
 * {@link storedSessionCodec} in both directions. `exp` is the token's Unix
 * expiry in seconds, as returned by Payload.
 */
export const sessionSchema = z.object({
	serverUrl: z.string().min(1),
	collectionSlug: z.string().min(1),
	token: z.string().min(1),
	exp: z.number(),
	user: sessionUserSchema,
});

export type Session = z.infer<typeof sessionSchema>;

/**
 * the keychain boundary in both directions at once: the stored entry is a JSON
 * **string**, the domain value is a {@link Session}. pairing them in one codec
 * is what stops the write half from serializing a shape the read half would
 * reject — the drift a separate `JSON.stringify` invites.
 *
 * adapted from the `json(schema)` template in Zod's codec documentation, which
 * is published to be copied rather than imported (the package exports no such
 * codec and has no `./codecs` subpath). one difference is deliberate: the
 * template puts the offending input, and the JSON parser's own message, onto
 * the issue it raises. here the input is the stored session, which carries a
 * bearer token, and the parser's message quotes a fragment of it — so the issue
 * names the failure and nothing else. the caller reports this error, and a
 * reported error leaves the device.
 */
export const storedSessionCodec = z.codec(z.string(), sessionSchema, {
	decode: (storedJson, ctx) => {
		try {
			return JSON.parse(storedJson);
		} catch {
			ctx.issues.push({
				code: "invalid_format",
				format: "json",
				input: undefined,
				message: "The stored session is not valid JSON.",
			});

			return z.NEVER;
		}
	},
	encode: (session) => JSON.stringify(session),
});
