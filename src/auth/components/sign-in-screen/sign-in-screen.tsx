import { useMutation } from "@tanstack/react-query";
import { type JSX, useCallback, useEffect, useRef, useState } from "react";
import {
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
import { readLastServerUrl } from "~/auth/helpers/last-server-url";
import { PayloadRequestError } from "~/auth/helpers/payload-client";
import { normalizeServerUrl } from "~/auth/helpers/server-url";
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
 * The Payload sign-in form: server URL, auth collection (defaulted), email, and
 * password. The Server URL field pre-fills on mount with the last successful
 * sign-in's endpoint (kept in the keychain) so a returning user need not retype
 * it. On success it persists the session (via the sign-in mutation), which
 * flips the app to authenticated — the root navigator then swaps this
 * signed-out stack for the tab UI. Failures surface inline without leaving the
 * screen.
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
	const [validationError, setValidationError] = useState<string | null>(null);
	const serverUrlEdited = useRef(false);

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

	// Clears any prior error as soon as the user changes an input.
	const clearErrors = useCallback(() => {
		setValidationError(null);
		if (error) {
			reset();
		}
	}, [error, reset]);

	const onSubmit = useCallback(() => {
		const normalizedUrl = normalizeServerUrl(serverUrl);
		if (normalizedUrl === null) {
			setValidationError(
				"Enter a valid server URL, e.g. https://cms.example.com.",
			);
			return;
		}

		const collectionSlug = collection.trim();
		if (collectionSlug === "") {
			setValidationError("Enter the auth collection slug.");
			return;
		}

		const trimmedEmail = email.trim();
		if (trimmedEmail === "" || password === "") {
			setValidationError("Enter your email and password.");
			return;
		}

		setValidationError(null);
		mutate({
			serverUrl: normalizedUrl,
			collectionSlug,
			email: trimmedEmail,
			password,
		});
	}, [serverUrl, collection, email, password, mutate]);

	const message = validationError ?? (error ? messageForError(error) : null);
	const canSubmit =
		!isPending &&
		serverUrl.trim() !== "" &&
		email.trim() !== "" &&
		password !== "";

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
				<View style={styles.field}>
					<Text style={styles.label}>Server URL</Text>
					<TextInput
						accessibilityLabel="Server URL"
						autoCapitalize="none"
						autoCorrect={false}
						inputMode="url"
						onChangeText={(next) => {
							serverUrlEdited.current = true;
							setServerUrl(next);
							clearErrors();
						}}
						placeholder="https://cms.example.com"
						placeholderTextColor={theme.colors.text.neutral.base}
						style={styles.input}
						testID="sign-in-server-url"
						value={serverUrl}
					/>
				</View>

				<SignInCollectionField
					editing={editingCollection}
					onChangeText={(next) => {
						setCollection(next);
						clearErrors();
					}}
					onEdit={() => setEditingCollection(true)}
					value={collection}
				/>

				<View style={styles.field}>
					<Text style={styles.label}>Email</Text>
					<TextInput
						accessibilityLabel="Email"
						autoCapitalize="none"
						autoCorrect={false}
						inputMode="email"
						onChangeText={(next) => {
							setEmail(next);
							clearErrors();
						}}
						placeholder="you@example.com"
						placeholderTextColor={theme.colors.text.neutral.base}
						style={styles.input}
						testID="sign-in-email"
						value={email}
					/>
				</View>

				<View style={styles.field}>
					<Text style={styles.label}>Password</Text>
					<TextInput
						accessibilityLabel="Password"
						autoCapitalize="none"
						autoCorrect={false}
						onChangeText={(next) => {
							setPassword(next);
							clearErrors();
						}}
						placeholderTextColor={theme.colors.text.neutral.base}
						secureTextEntry
						style={styles.input}
						testID="sign-in-password"
						value={password}
					/>
				</View>

				{message !== null ? (
					<Text style={styles.error} testID="sign-in-error">
						{message}
					</Text>
				) : null}

				<Pressable
					accessibilityRole="button"
					accessibilityState={{ disabled: !canSubmit }}
					disabled={!canSubmit}
					onPress={onSubmit}
					style={({ pressed }) => [
						styles.submit,
						!canSubmit && styles.submitDisabled,
						pressed && styles.submitPressed,
					]}
					testID="sign-in-submit"
				>
					<Text style={styles.submitLabel}>
						{isPending ? "Signing in…" : "Sign in"}
					</Text>
				</Pressable>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create((theme) => ({
	content: {
		padding: theme.gap.md,
		rowGap: theme.gap.md,
	},
	error: {
		...theme.typography.caption,
		color: theme.colors.text.destructive.base,
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
		justifyContent: "center",
		minHeight: 50,
	},
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
