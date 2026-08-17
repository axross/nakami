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
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	Text,
	TextInput,
	View,
} from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { SignInCollectionField } from "~/auth/components/sign-in-screen/sign-in-collection-field";
import { SignInErrorSummary } from "~/auth/components/sign-in-screen/sign-in-error-summary";
import { SignInFieldError } from "~/auth/components/sign-in-screen/sign-in-field-error";
import { readLastServerUrl } from "~/auth/helpers/last-server-url";
import { PayloadRequestError } from "~/auth/helpers/payload-client";
import {
	countSignInFieldErrors,
	firstSignInFieldError,
	type SignInField,
	type SignInFormErrors,
	signInFieldLabel,
	validateSignInForm,
} from "~/auth/helpers/sign-in-form";
import { getSignInMutationOptions } from "~/auth/mutations/sign-in-mutation";

const DEFAULT_COLLECTION = "users";

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
 * The error summary's copy. Written once because the banner and the screen
 * reader announcement both say it, and a reader who hears one and then reaches
 * the other should not find two different sentences.
 */
function problemCountMessage(count: number): string {
	return `${count} problems to fix`;
}

/**
 * What a screen reader is told after a press that produced messages: the
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
 * Announces a message to a screen reader on iOS. The error components carry
 * `accessibilityLiveRegion`, which React Native implements on Android only —
 * this is the other half, and the platform guard is what stops Android from
 * announcing the same message twice.
 *
 * Queued rather than spoken over what is already being said. Every message here
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
 * The Payload sign-in form: server URL, auth collection (defaulted), email, and
 * password. The Server URL field pre-fills on mount with the last successful
 * sign-in's endpoint (kept in the keychain) so a returning user need not retype
 * it. On success it persists the session (via the sign-in mutation), which
 * flips the app to authenticated — the root navigator then swaps this
 * signed-out stack for the tab UI. Failures surface inline without leaving the
 * screen.
 *
 * Sign in stays pressable whenever no submission is in flight: the press is
 * what validates the form, so a blank field is answered with a message naming
 * it rather than with a control the user cannot press. Field-level messages
 * render beside their input; the server's own rejection belongs to the form and
 * keeps the shared slot above the button.
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
	const serverUrlEdited = useRef(false);

	const serverUrlRef = useRef<TextInput>(null);
	const collectionRef = useRef<TextInput>(null);
	const emailRef = useRef<TextInput>(null);
	const passwordRef = useRef<TextInput>(null);

	// Pre-fill the server URL with the last successful sign-in's endpoint, but
	// never overwrite input the user has already started typing before this
	// keychain read resolves.
	useEffect(() => {
		let active = true;

		void readLastServerUrl().then((stored) => {
			if (active && stored !== null && !serverUrlEdited.current) {
				setServerUrl(stored);
			}
		});

		return () => {
			active = false;
		};
	}, []);

	const serverErrorMessage = error === null ? null : messageForError(error);

	// The server's rejection is announced the same way a validation failure is;
	// the banner's own live region covers Android.
	useEffect(() => {
		if (serverErrorMessage !== null) {
			announce(serverErrorMessage);
		}
	}, [serverErrorMessage]);

	// Editing a field drops the server's rejection — it was about the values the
	// user has just changed. A field already showing a message is re-checked
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
		},
		[serverUrl, collection, email, password, error, reset],
	);

	// Leaving a field checks that one field, so an invalid value is reported
	// where the user left it rather than waiting for a press of Sign in. Every
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

			// Announced beside the state write rather than inside the updater,
			// which stays pure. A message identical to the one the field is already
			// showing is not re-announced: a second blur of an untouched field has
			// told the user nothing they have not heard.
			if (message !== undefined && message !== fieldErrors[field]) {
				announce(message);
			}
		},
		[serverUrl, collection, email, password, fieldErrors],
	);

	const onSubmit = useCallback(() => {
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

		mutate(values);
	}, [serverUrl, collection, email, password, mutate]);

	// The summary links to the first offending field rather than focusing it on
	// press, which would open the keyboard on every failed submit.
	//
	// Every field has an input to focus by the time it can be at fault, the
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

				<View style={styles.field}>
					<Text style={styles.label}>Server URL</Text>
					<TextInput
						accessibilityLabel={signInFieldLabel(
							"Server URL",
							fieldErrors.serverUrl,
						)}
						autoCapitalize="none"
						autoCorrect={false}
						inputMode="url"
						onBlur={() => onFieldBlur("serverUrl")}
						onChangeText={(next) => {
							serverUrlEdited.current = true;
							setServerUrl(next);
							onFieldChange("serverUrl", next);
						}}
						placeholder="https://cms.example.com"
						placeholderTextColor={theme.colors.text.neutral.base}
						ref={serverUrlRef}
						style={[
							styles.input,
							fieldErrors.serverUrl !== undefined && styles.inputFlagged,
						]}
						testID="sign-in-server-url"
						value={serverUrl}
					/>
					{fieldErrors.serverUrl === undefined ? null : (
						<SignInFieldError
							message={fieldErrors.serverUrl}
							testID="sign-in-error-server-url"
						/>
					)}
				</View>

				<SignInCollectionField
					editing={editingCollection}
					error={fieldErrors.collection}
					inputRef={collectionRef}
					onBlur={() => onFieldBlur("collection")}
					onChangeText={(next) => {
						setCollection(next);
						onFieldChange("collection", next);
					}}
					onEdit={() => setEditingCollection(true)}
					value={collection}
				/>

				<View style={styles.field}>
					<Text style={styles.label}>Email</Text>
					<TextInput
						accessibilityLabel={signInFieldLabel("Email", fieldErrors.email)}
						autoCapitalize="none"
						autoCorrect={false}
						inputMode="email"
						onBlur={() => onFieldBlur("email")}
						onChangeText={(next) => {
							setEmail(next);
							onFieldChange("email", next);
						}}
						placeholder="you@example.com"
						placeholderTextColor={theme.colors.text.neutral.base}
						ref={emailRef}
						style={[
							styles.input,
							fieldErrors.email !== undefined && styles.inputFlagged,
						]}
						testID="sign-in-email"
						value={email}
					/>
					{fieldErrors.email === undefined ? null : (
						<SignInFieldError
							message={fieldErrors.email}
							testID="sign-in-error-email"
						/>
					)}
				</View>

				<View style={styles.field}>
					<Text style={styles.label}>Password</Text>
					<TextInput
						accessibilityLabel={signInFieldLabel(
							"Password",
							fieldErrors.password,
						)}
						autoCapitalize="none"
						autoCorrect={false}
						onBlur={() => onFieldBlur("password")}
						onChangeText={(next) => {
							setPassword(next);
							onFieldChange("password", next);
						}}
						placeholderTextColor={theme.colors.text.neutral.base}
						ref={passwordRef}
						secureTextEntry
						style={[
							styles.input,
							fieldErrors.password !== undefined && styles.inputFlagged,
						]}
						testID="sign-in-password"
						value={password}
					/>
					{fieldErrors.password === undefined ? null : (
						<SignInFieldError
							message={fieldErrors.password}
							testID="sign-in-error-password"
						/>
					)}
				</View>

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
						/>
					) : null}
					<Text style={styles.submitLabel}>
						{isPending ? "Signing in…" : "Sign in"}
					</Text>
				</Pressable>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create((theme, rt) => ({
	// The stack header clears the top edge, so this screen owns the bottom and
	// the horizontal pair. The insets sit on the scrolled content rather than on
	// the `ScrollView` itself: padding the scroll view would inset its scroll
	// indicators with it and leave the form stopping short of the screen edge
	// with a dead band beyond it.
	content: {
		paddingBottom: Math.max(rt.insets.bottom, theme.gap.md),
		paddingEnd: Math.max(rt.insets.right, theme.gap.md),
		paddingStart: Math.max(rt.insets.left, theme.gap.md),
		paddingTop: theme.gap.md,
		rowGap: theme.gap.md,
	},
	field: {
		rowGap: theme.gap.xs,
	},
	input: {
		...theme.typography.body,
		backgroundColor: theme.colors.foundation.neutral.subtle,
		borderColor: theme.colors.border.neutral.subtle,
		borderRadius: theme.radius.md,
		borderWidth: theme.borderWidth.hairline,
		color: theme.colors.text.neutral.intense,
		minHeight: 48,
		paddingHorizontal: theme.gap.sm,
	},
	// The flagged input's border and fill are the error's second and third cues,
	// beside the message's own icon — the treatment has to survive a reader who
	// cannot tell the destructive tone from the neutral one.
	inputFlagged: {
		backgroundColor: theme.colors.foundation.destructive.subtle,
		borderColor: theme.colors.border.destructive.base,
	},
	label: {
		...theme.typography.caption,
		color: theme.colors.text.neutral.base,
	},
	root: {
		backgroundColor: theme.colors.foundation.neutral.bare,
		flex: 1,
	},
	submit: {
		alignItems: "center",
		backgroundColor: theme.colors.solid.accent.base,
		borderRadius: theme.radius.md,
		columnGap: theme.gap.xs,
		flexDirection: "row",
		justifyContent: "center",
		minHeight: 50,
	},
	// Reserved for a submission already in flight, which is the only state this
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
