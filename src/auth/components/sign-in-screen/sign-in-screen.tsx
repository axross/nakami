import { useMutation } from "@tanstack/react-query";
import { CircleAlert, TriangleAlert } from "lucide-react-native";
import {
	type JSX,
	type RefObject,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import {
	AccessibilityInfo,
	ActivityIndicator,
	Keyboard,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	Text,
	type TextInput,
} from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { CredentialConsentDialog } from "~/auth/components/credential-consent-dialog/credential-consent-dialog";
import { SignInCollectionField } from "~/auth/components/sign-in-screen/sign-in-collection-field";
import { SignInErrorSummary } from "~/auth/components/sign-in-screen/sign-in-error-summary";
import { SignInTextField } from "~/auth/components/sign-in-screen/sign-in-text-field";
import { readLastServerUrl } from "~/auth/helpers/last-server-url";
import { PayloadRequestError } from "~/auth/helpers/payload-client";
import {
	countSignInFieldErrors,
	firstSignInFieldError,
	type SignInField,
	type SignInFormErrors,
	validateSignInForm,
} from "~/auth/helpers/sign-in-form";
import type { Session } from "~/auth/models/session";
import {
	getSignInMutationOptions,
	type SignInInput,
} from "~/auth/mutations/sign-in-mutation";
import { useAuthStore } from "~/auth/stores/auth-store";

const DEFAULT_COLLECTION = "users";

/**
 * a sign-in the server has already accepted, waiting on the consent dialog. it
 * is held here rather than committed by the mutation, because committing it
 * flips the store and unmounts this whole stack — so the dialog would never be
 * seen. `credentials` is the mutation's own input, so what the dialog offers to
 * keep is exactly what the server just accepted.
 */
interface PendingSignIn {
	credentials: SignInInput;
	session: Session;
}

function messageForError(error: unknown): string {
	if (error instanceof PayloadRequestError) {
		if (error.kind === "auth") {
			return "Incorrect email or password.";
		}
		if (error.kind === "network") {
			return "Couldn't reach the server. Check the URL and try again.";
		}
	}

	return "Something went wrong. Please try again.";
}

/**
 * the error summary's copy. written once because the banner and the screen
 * reader announcement both say it, and a reader who hears one and then reaches
 * the other should not find two different sentences.
 */
function problemCountMessage(count: number): string {
	return `${count} problems to fix`;
}

/**
 * what a screen reader is told after a press that produced messages: the
 * problem count when the summary is on screen, and otherwise the one message
 * that is, since announcing "1 problems to fix" would say less than the message
 * itself does.
 */
function announcementFor(errors: SignInFormErrors): string | null {
	const count = countSignInFieldErrors(errors);
	if (count > 1) {
		return problemCountMessage(count);
	}

	const field = firstSignInFieldError(errors);

	return field === null ? null : (errors[field] ?? null);
}

/**
 * announces a message to a screen reader on iOS. the error components carry
 * `accessibilityLiveRegion`, which React Native implements on Android only —
 * this is the other half, and the platform guard is what stops Android from
 * announcing the same message twice.
 *
 * queued rather than spoken over what is already being said. every message here
 * is raised by an interaction VoiceOver is itself narrating — a field losing
 * focus, or the submit button taking it — and an unqueued announcement is
 * clipped by that narration. `queue` is an iOS-only option, which this guard
 * already restricts the call to.
 */
function announce(message: string): void {
	if (Platform.OS === "ios") {
		AccessibilityInfo.announceForAccessibilityWithOptions(message, {
			queue: true,
		});
	}
}

/**
 * the Payload sign-in form: server URL, auth collection (defaulted), email, and
 * password. the Server URL field pre-fills on mount with the last successful
 * sign-in's endpoint (kept in the keychain) so a returning user need not retype
 * it. on success it persists the session (via the sign-in mutation), which
 * flips the app to authenticated — the root navigator then swaps this
 * signed-out stack for the tab UI. failures surface inline without leaving the
 * screen.
 *
 * Sign in stays pressable whenever no submission is in flight: the press is
 * what validates the form, so a blank field is answered with a message naming
 * it rather than with a control the user cannot press. field-level messages
 * render beside their input; the server's own rejection belongs to the form and
 * keeps the shared slot above the button.
 *
 * each field says through `autoComplete` what it holds — or that it holds
 * nothing worth offering. it is the one prop that reaches both platforms:
 * React Native maps it to Android's native autofill hint and to iOS's
 * `textContentType` itself, so neither of those is set here.
 *
 * the credential pair has to carry a value, because a field left silent is not
 * neutral — silence is precisely what Android reads as
 * `IMPORTANT_FOR_AUTOFILL_NO`. the Collection field is the other case: `off`
 * reaches that same Android state, so it buys nothing there, and is worth
 * saying anyway. it is the only way to reach iOS's `none`, and the only way a
 * later reader can tell the field was excluded on purpose rather than missed.
 *
 * the return key chains the inputs, and `submitBehavior="submit"` is what keeps
 * the keyboard up as it moves between them — the default blurs first, closing
 * and reopening it.
 */
export function SignInScreen(): JSX.Element {
	const { theme } = useUnistyles();
	const { mutate, isPending, error, reset } = useMutation(
		getSignInMutationOptions(),
	);

	const [serverUrl, setServerUrl] = useState("");
	const [collection, setCollection] = useState(DEFAULT_COLLECTION);
	const [editingCollection, setEditingCollection] = useState(false);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [fieldErrors, setFieldErrors] = useState<SignInFormErrors>({});
	const [pendingSignIn, setPendingSignIn] = useState<PendingSignIn | null>(
		null,
	);
	const [answering, setAnswering] = useState(false);
	// a failure of the keychain write behind the consent answer. it is not the
	// mutation's error — the server already said yes by then — but it is the same
	// kind of thing to the person reading it, so it shares the mutation's slot
	// rather than inventing a second place for a failed sign-in to be reported.
	const [completionError, setCompletionError] = useState<unknown>(null);
	const serverUrlEdited = useRef(false);

	const serverUrlRef = useRef<TextInput>(null);
	const collectionRef = useRef<TextInput>(null);
	const emailRef = useRef<TextInput>(null);
	const passwordRef = useRef<TextInput>(null);

	const signInFailure = error ?? completionError;
	const serverErrorMessage =
		signInFailure === null ? null : messageForError(signInFailure);

	// the server's rejection is announced the same way a validation failure is;
	// the banner's own live region covers Android.
	useEffect(() => {
		if (serverErrorMessage !== null) {
			announce(serverErrorMessage);
		}
	}, [serverErrorMessage]);

	// editing a field drops the server's rejection — it was about the values the
	// user has just changed. a field already showing a message is re-checked
	// against the new value, so the message clears the moment it stops being
	// true; a quiet field stays quiet until it is blurred or the form submitted.
	const onFieldChange = useCallback(
		(field: SignInField, next: string) => {
			setFieldErrors((current) => {
				if (current[field] === undefined) {
					return current;
				}

				const { errors } = validateSignInForm({
					serverUrl,
					collection,
					email,
					password,
					[field]: next,
				});

				return { ...current, [field]: errors[field] };
			});

			if (error !== null) {
				reset();
			}
			setCompletionError(null);
		},
		[serverUrl, collection, email, password, error, reset],
	);

	// leaving a field checks that one field, so an invalid value is reported
	// where the user left it rather than waiting for a press of Sign in. every
	// other field's message is left exactly as it stands.
	const onFieldBlur = useCallback(
		(field: SignInField) => {
			const { errors } = validateSignInForm({
				serverUrl,
				collection,
				email,
				password,
			});
			const message = errors[field];

			setFieldErrors((current) => ({ ...current, [field]: message }));

			// announced beside the state write rather than inside the updater,
			// which stays pure. a message identical to the one the field is already
			// showing is not re-announced: a second blur of an untouched field has
			// told the user nothing they have not heard.
			if (message !== undefined && message !== fieldErrors[field]) {
				announce(message);
			}
		},
		[serverUrl, collection, email, password, fieldErrors],
	);

	// held in a ref so the mount effect below can take the same path a keystroke
	// does without listing a callback that changes on every render — which would
	// re-read the keychain each time the user types.
	const onFieldChangeRef = useRef(onFieldChange);
	useEffect(() => {
		onFieldChangeRef.current = onFieldChange;
	});

	// pre-fill the server URL with the last successful sign-in's endpoint, but
	// never overwrite input the user has already started typing before this
	// keychain read resolves.
	//
	// the arriving value goes through the same clearing path an edit does. press
	// Sign in, or blur the field, before this read settles and the field would
	// otherwise end up holding a valid URL while still carrying "Enter your
	// server URL." — with the flagged border, the composed accessible name, and a
	// place in the problem count — a message contradicting the value beside it.
	useEffect(() => {
		let active = true;

		void readLastServerUrl().then((stored) => {
			if (active && stored !== null && !serverUrlEdited.current) {
				setServerUrl(stored);
				onFieldChangeRef.current("serverUrl", stored);
			}
		});

		return () => {
			active = false;
		};
	}, []);

	const onSubmit = useCallback(() => {
		// the in-flight gate lives here rather than beside one caller, because
		// there are two: the button carries a `disabled` state, and the Password
		// field's Go key has none to carry. guarding only the button would leave
		// Go able to start a second sign-in over the first — another login POST
		// and another keychain write — which is the instinct a slow self-hosted
		// server invites.
		if (isPending) {
			return;
		}

		const { errors, values } = validateSignInForm({
			serverUrl,
			collection,
			email,
			password,
		});

		setFieldErrors(errors);

		if (values === null) {
			const announcement = announcementFor(errors);
			if (announcement !== null) {
				announce(announcement);
			}
			return;
		}

		// `mutate` clears the mutation's own error; this is the other half of the
		// slot the two share, so a stale failure does not sit over a fresh attempt.
		setCompletionError(null);
		mutate(values, {
			// the session is held rather than committed: `authenticate` is what the
			// consent dialog's answer calls, once there is an answer.
			onSuccess: (session) => {
				// pressing the button rather than the Password field's Go leaves the
				// keyboard up, and it would otherwise stay up behind the dialog —
				// over the dialog's own answers on a short screen.
				Keyboard.dismiss();
				setPendingSignIn({ credentials: values, session });
			},
		});
	}, [serverUrl, collection, email, password, isPending, mutate]);

	// the dialog's two answers differ in one argument and nothing else, so they
	// are one callback rather than two that could drift apart.
	const onConsentAnswer = useCallback(
		(keep: boolean) => {
			if (pendingSignIn === null || answering) {
				return;
			}

			setAnswering(true);
			void useAuthStore
				.getState()
				.authenticate(
					pendingSignIn.session,
					keep ? pendingSignIn.credentials : undefined,
				)
				.catch((failure: unknown) => {
					// the keychain refused the write, so the user is not signed in
					// after all. drop the dialog and say so on the form, which is still
					// mounted underneath holding everything they typed.
					setPendingSignIn(null);
					setCompletionError(failure);
				})
				.finally(() => {
					setAnswering(false);
				});
		},
		[answering, pendingSignIn],
	);

	// the summary links to the first offending field rather than focusing it on
	// press, which would open the keyboard on every failed submit.
	//
	// every field has an input to focus by the time it can be at fault, the
	// Collection field included: its value starts non-empty and is only ever
	// emptied through the input the pencil reveals, so it cannot be flagged
	// while it is still showing plain text.
	const onSummaryPress = useCallback(() => {
		const field = firstSignInFieldError(fieldErrors);
		if (field === null) {
			return;
		}

		const inputRefs: Record<SignInField, RefObject<TextInput | null>> = {
			serverUrl: serverUrlRef,
			collection: collectionRef,
			email: emailRef,
			password: passwordRef,
		};

		inputRefs[field].current?.focus();
	}, [fieldErrors]);

	const errorCount = countSignInFieldErrors(fieldErrors);

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === "ios" ? "padding" : undefined}
			style={styles.root}
		>
			<ScrollView
				contentContainerStyle={styles.content}
				keyboardShouldPersistTaps="handled"
				testID="sign-in-screen"
			>
				{errorCount > 1 ? (
					<SignInErrorSummary
						icon={TriangleAlert}
						message={problemCountMessage(errorCount)}
						onPress={onSummaryPress}
						testID="sign-in-error-summary"
					/>
				) : null}

				{/*
				 * no password manager fills this field on either platform — the
				 * credential one hands back is an account name and a password and
				 * nothing else — so the keychain pre-fill above stays its answer, and
				 * the hint is only worth the iOS half. `url` is what iOS reads as a
				 * URL field, and Android has no server-address hint to map it to.
				 *
				 * Android gets `off` rather than nothing. the two reach the same
				 * native state, so it buys no behaviour there — it is the choice the
				 * Collection field makes, for the same reason: it leaves no field on
				 * this form excluded by omission, which is indistinguishable from a
				 * hint someone forgot. passing `url` through unguarded would instead
				 * arrive unmapped, log `Invalid autoComplete: url`, and disable the
				 * field anyway.
				 *
				 * the return key advances to whichever input exists at that moment.
				 * the Collection field renders as plain text until its pencil is
				 * pressed and has none to receive focus until then, so this one skips
				 * past it to Email while it is not being edited.
				 */}
				<SignInTextField
					autoCapitalize="none"
					autoComplete={Platform.OS === "ios" ? "url" : "off"}
					autoCorrect={false}
					error={fieldErrors.serverUrl}
					errorTestID="sign-in-error-server-url"
					inputMode="url"
					inputRef={serverUrlRef}
					label="Server URL"
					onBlur={() => onFieldBlur("serverUrl")}
					onChangeText={(next) => {
						serverUrlEdited.current = true;
						setServerUrl(next);
						onFieldChange("serverUrl", next);
					}}
					onSubmitEditing={() => {
						(editingCollection ? collectionRef : emailRef).current?.focus();
					}}
					placeholder="https://cms.example.com"
					returnKeyType="next"
					submitBehavior="submit"
					testID="sign-in-server-url"
					value={serverUrl}
				/>

				<SignInCollectionField
					// spread as one discriminated object: the field accepts `error`
					// only alongside `editing: true`, so the two cannot be handed over
					// as independent props.
					{...(editingCollection
						? { editing: true as const, error: fieldErrors.collection }
						: { editing: false as const })}
					inputRef={collectionRef}
					onBlur={() => onFieldBlur("collection")}
					onChangeText={(next) => {
						setCollection(next);
						onFieldChange("collection", next);
					}}
					onEdit={() => setEditingCollection(true)}
					onSubmitEditing={() => emailRef.current?.focus()}
					value={collection}
				/>

				{/*
				 * `username` rather than `email`: it is the pairing of a username hint
				 * with a password hint that both platforms read as a login form, where
				 * `email` describes a contact field. the email keyboard is unaffected —
				 * that is `inputMode`, beside it.
				 */}
				<SignInTextField
					autoCapitalize="none"
					autoComplete="username"
					autoCorrect={false}
					error={fieldErrors.email}
					errorTestID="sign-in-error-email"
					inputMode="email"
					inputRef={emailRef}
					label="Email"
					onBlur={() => onFieldBlur("email")}
					onChangeText={(next) => {
						setEmail(next);
						onFieldChange("email", next);
					}}
					onSubmitEditing={() => passwordRef.current?.focus()}
					placeholder="you@example.com"
					returnKeyType="next"
					submitBehavior="submit"
					testID="sign-in-email"
					value={email}
				/>

				{/*
				 * the last field submits rather than advancing, through the same
				 * callback the button presses — so the keyboard's Go and a press of
				 * Sign in cannot come to mean different things. it keeps the default
				 * submit behaviour: no field is left to move to, so dismissing the
				 * keyboard is what the user wants next.
				 *
				 * `current-password` is the cross-platform spelling of the password
				 * hint; the bare `password` value is Android-only here.
				 */}
				<SignInTextField
					autoCapitalize="none"
					autoComplete="current-password"
					autoCorrect={false}
					error={fieldErrors.password}
					errorTestID="sign-in-error-password"
					inputRef={passwordRef}
					label="Password"
					onBlur={() => onFieldBlur("password")}
					onChangeText={(next) => {
						setPassword(next);
						onFieldChange("password", next);
					}}
					onSubmitEditing={onSubmit}
					returnKeyType="go"
					secureTextEntry
					testID="sign-in-password"
					value={password}
				/>

				{serverErrorMessage === null ? null : (
					<SignInErrorSummary
						icon={CircleAlert}
						message={serverErrorMessage}
						testID="sign-in-error"
					/>
				)}

				<Pressable
					accessibilityRole="button"
					accessibilityState={{ disabled: isPending }}
					disabled={isPending}
					onPress={onSubmit}
					style={({ pressed }) => [
						styles.submit,
						isPending && styles.submitDisabled,
						pressed && styles.submitPressed,
					]}
					testID="sign-in-submit"
				>
					{isPending ? (
						<ActivityIndicator
							color={theme.colors.text.onAccent}
							size="small"
							testID="sign-in-submit-spinner"
						/>
					) : null}
					<Text style={styles.submitLabel}>
						{isPending ? "Signing in…" : "Sign in"}
					</Text>
				</Pressable>
			</ScrollView>

			{pendingSignIn === null ? null : (
				<CredentialConsentDialog
					disabled={answering}
					onAllow={() => onConsentAnswer(true)}
					onDecline={() => onConsentAnswer(false)}
					serverUrl={pendingSignIn.session.serverUrl}
				/>
			)}
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create((theme, rt) => ({
	// the stack header clears the top edge, so this screen owns the bottom and
	// the horizontal pair. the insets sit on the scrolled content rather than on
	// the `ScrollView` itself: padding the scroll view would inset its scroll
	// indicators with it and leave the form stopping short of the screen edge
	// with a dead band beyond it.
	content: {
		rowGap: theme.gap.md,
		paddingTop: theme.gap.md,
		paddingBottom: Math.max(rt.insets.bottom, theme.gap.md),
		paddingStart: Math.max(rt.insets.left, theme.gap.md),
		paddingEnd: Math.max(rt.insets.right, theme.gap.md),
	},
	root: {
		flex: 1,
		backgroundColor: theme.colors.foundation.neutral.bare,
	},
	submit: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		columnGap: theme.gap.xs,
		minHeight: 50,
		backgroundColor: theme.colors.solid.accent.base,
		borderRadius: theme.radius.md,
	},
	// reserved for a submission already in flight, which is the only state this
	// button is disabled in; the spinner and the working-state label beside it
	// are what keep that reading as working rather than as blocked.
	submitDisabled: {
		opacity: 0.5,
	},
	submitLabel: {
		...theme.typography.heading,
		color: theme.colors.text.onAccent,
	},
	submitPressed: {
		opacity: 0.6,
	},
}));
