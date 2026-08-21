import type { JSX } from "react";
import { TextInput } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import type { InlineFieldKind } from "~/collections/helpers/record-fields";

/**
 * the text control behind the two kinds a row still edits in place: a
 * single-line string field and a number field. one component rather than two,
 * because they differ only in keyboard — everything the flagged treatment and
 * the blur contract do is identical.
 *
 * a newline-carrying string and a raw-JSON value used to be here too, on a
 * taller variant of this same input. they are edited in a screen of their own
 * now, so this control is one line by construction rather than by a prop: what
 * it holds always fits on one, which is what lets the height, the keyboard
 * dismissal, and the wrapping stop being decisions.
 *
 * `onCommit` fires on blur rather than on every keystroke, which is what makes
 * a save one request per edit instead of one per character. the value is held
 * by the caller so the typed text survives a refusal.
 */
export function CollectionRecordFieldInput({
	accessibilityLabel,
	isRefused,
	kind,
	onChangeText,
	onCommit,
	testID,
	value,
}: Readonly<{
	accessibilityLabel: string;
	isRefused: boolean;
	kind: InlineFieldKind;
	onChangeText: (text: string) => void;
	onCommit: () => void;
	testID: string;
	value: string;
}>): JSX.Element {
	const { theme } = useUnistyles();

	styles.useVariants({ refused: isRefused });

	return (
		<TextInput
			accessibilityLabel={accessibilityLabel}
			keyboardType={kind === "number" ? "numeric" : "default"}
			onBlur={onCommit}
			onChangeText={onChangeText}
			placeholderTextColor={theme.colors.text.neutral.base}
			style={styles.input}
			testID={testID}
			value={value}
		/>
	);
}

/**
 * this control's stylesheet, exported for one reason. the jest mock for
 * Unistyles strips `variants` from every stylesheet and stubs `useVariants` to
 * a no-op, so under test a refused input and an ordinary one render identically
 * and no assertion on the refused colours can fail. the selection is the one
 * thing still observable, and a test spies on `useVariants` through this
 * reference — see collection-record-field-row.test.tsx. it is not a styling
 * API, and nothing outside that test should consume it.
 */
export const styles = StyleSheet.create((theme) => ({
	input: {
		...theme.typography.body,
		minHeight: 48,
		paddingHorizontal: theme.gap.sm,
		color: theme.colors.text.neutral.intense,
		borderWidth: theme.borderWidth.hairline,
		borderRadius: theme.radius.md,
		// the refused border and ground are the refusal's second and third cues,
		// beside the marker on the label line and the message beneath — the
		// treatment has to survive a reader who cannot tell the destructive tone
		// from the neutral one. the same pair the sign-in form's flagged field
		// uses, because it is the same statement. `refused` is a closed boolean,
		// so it is a variant rather than a dynamic-function argument; `default`
		// repeats the resting pair so a body that never selected would still
		// render a defined surface.
		variants: {
			refused: {
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
}));
