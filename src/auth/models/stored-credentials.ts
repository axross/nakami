import { z } from "zod";

/**
 * the sign-in a silent re-authentication replays: everything
 * `POST /api/{collection}/login` needs, and nothing else. it is stored only
 * when the user allowed it at the consent dialog, and it is discarded the
 * moment the server refuses it or the user signs out.
 *
 * `email` is `min(1)` rather than {@link z.email}, unlike the session's user,
 * and the difference is deliberate: the sign-in form checks only that the field
 * is non-empty, because Payload's `loginWithUsername` lets an auth collection
 * accept a username in the same field. a stricter schema here would reject a
 * value the form accepted and the server honoured, turning a working sign-in
 * into a session that cannot be revived.
 */
export const storedCredentialsSchema = z.object({
	serverUrl: z.string().min(1),
	collectionSlug: z.string().min(1),
	email: z.string().min(1),
	password: z.string().min(1),
});

export type StoredCredentials = z.infer<typeof storedCredentialsSchema>;

/**
 * the keychain boundary for {@link StoredCredentials}, in both directions at
 * once, exactly as `storedSessionCodec` is for the session — pairing the two
 * halves in one codec is what stops the write from storing a shape the read
 * would reject.
 *
 * the same precaution applies, and applies harder: the decode failure names the
 * failure and nothing else. the input here is a password rather than a bearer
 * token, `JSON.parse`'s own message quotes a fragment of whatever it choked on,
 * and this error is reported — a reported error leaves the device.
 */
export const storedCredentialsCodec = z.codec(
	z.string(),
	storedCredentialsSchema,
	{
		decode: (storedJson, ctx) => {
			try {
				return JSON.parse(storedJson);
			} catch {
				ctx.issues.push({
					code: "invalid_format",
					format: "json",
					input: undefined,
					message: "The stored credentials are not valid JSON.",
				});

				return z.NEVER;
			}
		},
		encode: (credentials) => JSON.stringify(credentials),
	},
);
