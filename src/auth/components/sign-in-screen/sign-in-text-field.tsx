import type { ComponentPropsWithRef, JSX, Ref } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { Text, TextInput, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { SignInFieldError } from "~/auth/components/sign-in-screen/sign-in-field-error";
import { signInFieldLabel } from "~/auth/helpers/sign-in-form";

/**
 * one labelled text field of the sign-in form: its name, its input, the
 * validation message the input is flagged by, and an optional hint beneath.
 *
 * every input on this screen is one of these, the Collection field's editable
 * state included, which is what gives the flagged treatment a single home. it
 * is also why this is a component rather than a shared style: the treatment is
 * a closed boolean and therefore a Unistyles variant, and `useVariants` selects
 * once per component body — so a screen drawing three inputs from one body
 * could not have expressed three independent states.
 *
 * the message is rendered rather than merely described: `signInFieldLabel`
 * folds it into the input's accessible name as well, because React Native has
 * no `aria-describedby` to bind the two with. see
 * docs/conventions/agent-skills.md.
 */
export function SignInTextField({
	label,
	error,
	errorTestID,
	hint,
	inputRef,
	style,
	...inputProps
}: Readonly<
	Omit<
		ComponentPropsWithRef<typeof TextInput>,
		"accessibilityLabel" | "ref" | "style"
	> & {
		label: string;
		error?: string;
		errorTestID: string;
		hint?: string;
		inputRef?: Ref<TextInput>;
		style?: StyleProp<ViewStyle>;
	}
>): JSX.Element {
	const { theme } = useUnistyles();

	styles.useVariants({ flagged: error !== undefined });

	return (
		<View style={[styles.field, style]}>
			<Text style={styles.label}>{label}</Text>

			<TextInput
				accessibilityLabel={signInFieldLabel(label, error)}
				placeholderTextColor={theme.colors.text.neutral.base}
				ref={inputRef}
				{...inputProps}
				style={styles.input}
			/>

			{error === undefined ? null : (
				<SignInFieldError message={error} testID={errorTestID} />
			)}

			{hint === undefined ? null : <Text style={styles.hint}>{hint}</Text>}
		</View>
	);
}

/**
 * this field's stylesheet, exported for one reason. the jest mock for Unistyles
 * strips `variants` from every stylesheet and stubs `useVariants` to a no-op,
 * so under test a flagged input and an unflagged one render identically and no
 * assertion on the flagged colours can fail. the selection is the one thing
 * still observable, and a test spies on `useVariants` through this reference —
 * see sign-in-text-field.test.tsx. it is not a styling API, and nothing outside
 * that test should consume it.
 */
export const styles = StyleSheet.create((theme) => ({
	field: {
		rowGap: theme.gap.xs,
	},
	hint: {
		...theme.typography.caption,
		color: theme.colors.text.neutral.base,
	},
	// the flagged border and ground are the error's second and third cues,
	// beside the message's own icon — the treatment has to survive a reader who
	// cannot tell the destructive tone from the neutral one. `flagged` is a
	// closed boolean, so it is a variant rather than a dynamic-function
	// argument; `default` repeats the unflagged pair so a body that never
	// selected would still render a defined surface.
	input: {
		...theme.typography.body,
		minHeight: 48,
		paddingHorizontal: theme.gap.sm,
		color: theme.colors.text.neutral.intense,
		borderWidth: theme.borderWidth.hairline,
		borderRadius: theme.radius.md,
		variants: {
			flagged: {
				default: {
					backgroundColor: theme.colors.foundation.neutral.subtle,
					borderColor: theme.colors.border.neutral.subtle,
				},
				false: {
					backgroundColor: theme.colors.foundation.neutral.subtle,
					borderColor: theme.colors.border.neutral.subtle,
				},
				true: {
					backgroundColor: theme.colors.foundation.destructive.subtle,
					borderColor: theme.colors.border.destructive.base,
				},
			},
		},
	},
	label: {
		...theme.typography.caption,
		color: theme.colors.text.neutral.base,
	},
}));
