import { normalizeServerUrl } from "~/auth/helpers/server-url";

/**
 * The sign-in form's fields, in the order they are rendered. The order is
 * load-bearing rather than decorative: it is what makes "the first offending
 * field" a well-defined target for the error summary, independent of the order
 * the messages happen to be written in.
 */
export const SIGN_IN_FIELDS = [
	"serverUrl",
	"collection",
	"email",
	"password",
] as const;

/** One of the sign-in form's fields. */
export type SignInField = (typeof SIGN_IN_FIELDS)[number];

/** The raw, user-entered values of the sign-in form. */
export interface SignInFormInput {
	serverUrl: string;
	collection: string;
	email: string;
	password: string;
}

/** A message per offending field; a field with no entry passed validation. */
export type SignInFormErrors = Partial<Record<SignInField, string>>;

/** The validated, normalized values the sign-in mutation is given. */
export interface SignInFormValues {
	serverUrl: string;
	collectionSlug: string;
	email: string;
	password: string;
}

/**
 * The outcome of validating the whole form: a message per offending field, and
 * the normalized values only when there are none. `values` is `null` exactly
 * when `errors` is non-empty, so a caller reads one field to decide whether to
 * submit.
 */
export interface SignInFormValidation {
	errors: SignInFormErrors;
	values: SignInFormValues | null;
}

/**
 * Validates every field of the sign-in form at once and normalizes the values
 * when all of them pass.
 *
 * Every field is checked on every call rather than stopping at the first
 * failure, so one press of Sign in can report everything that is wrong instead
 * of costing the user one press per blank field.
 *
 * The blank and the malformed server URL are deliberately separate messages
 * even though `normalizeServerUrl` returns `null` for both: "enter a URL" and
 * "that is not a URL" are different problems, and the second reads as an
 * accusation when the field is simply empty.
 */
export function validateSignInForm(
	input: Readonly<SignInFormInput>,
): SignInFormValidation {
	const errors: SignInFormErrors = {};

	const trimmedServerUrl = input.serverUrl.trim();
	const normalizedServerUrl = normalizeServerUrl(input.serverUrl);
	if (trimmedServerUrl === "") {
		errors.serverUrl = "Enter your server URL.";
	} else if (normalizedServerUrl === null) {
		errors.serverUrl =
			"Enter a valid server URL, e.g. https://cms.example.com.";
	}

	const collectionSlug = input.collection.trim();
	if (collectionSlug === "") {
		errors.collection = "Enter the auth collection slug.";
	}

	const email = input.email.trim();
	if (email === "") {
		errors.email = "Enter your email address.";
	}

	// The password is never trimmed: surrounding whitespace is a legitimate part
	// of a password, so only the wholly empty value is a validation failure.
	if (input.password === "") {
		errors.password = "Enter your password.";
	}

	// The second clause is redundant at run time — a `null` normalization has
	// already written a message above — and is what narrows the value to a
	// `string` for the normalized result below.
	if (Object.keys(errors).length > 0 || normalizedServerUrl === null) {
		return { errors, values: null };
	}

	return {
		errors,
		values: {
			serverUrl: normalizedServerUrl,
			collectionSlug,
			email,
			password: input.password,
		},
	};
}

/**
 * The first field carrying a message, in the form's own rendering order — the
 * one the error summary sends the user to. `null` when nothing is wrong.
 */
export function firstSignInFieldError(
	errors: Readonly<SignInFormErrors>,
): SignInField | null {
	return SIGN_IN_FIELDS.find((field) => errors[field] !== undefined) ?? null;
}

/** How many fields are currently reporting a problem. */
export function countSignInFieldErrors(
	errors: Readonly<SignInFormErrors>,
): number {
	return SIGN_IN_FIELDS.filter((field) => errors[field] !== undefined).length;
}

/**
 * A field's accessible name: its visible label on its own, or that label
 * followed by the field's message while it is flagged.
 *
 * This is how a flagged input tells assistive technology what is wrong with it.
 * The web answer is `aria-describedby`, which React Native has no equivalent of
 * — and its `aria-labelledby` is Android-only, so pairing an input with its
 * separate message node would leave VoiceOver exactly as silent as the
 * Android-only live region already does. Folding the message into the name is
 * cross-platform: a reader landing on a flagged input hears "Email, Enter your
 * email address." rather than "Email, text field", which is what the input's
 * destructive border and tinted ground already say to anyone who can see them.
 *
 * Sighted users are unaffected — the visible label is a separate `Text` node,
 * and this name is read by assistive technology only.
 */
export function signInFieldLabel(
	label: string,
	message: string | undefined,
): string {
	return message === undefined ? label : `${label}, ${message}`;
}
