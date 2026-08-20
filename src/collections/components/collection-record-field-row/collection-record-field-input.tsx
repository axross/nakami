import type { JSX } from "react";
import { TextInput } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import type { RecordFieldKind } from "~/collections/helpers/record-fields";

/**
 * how many lines of a raw-JSON value the editor opens to. it is a fixed
 * element dimension rather than a spacing step: the editor is sized to show a
 * small object whole without growing the row per record, and it scrolls past
 * that.
 */
const JSON_EDITOR_LINES = 4;

/**
 * the text control behind three of a record's four editable kinds: a string
 * field, a number field, and an array or object edited as raw JSON. one
 * component rather than three, because the three differ only in keyboard,
 * height, and whether the text may wrap — everything the flagged treatment and
 * the blur contract do is identical.
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
	kind: Exclude<RecordFieldKind, "boolean" | "none">;
	onChangeText: (text: string) => void;
	onCommit: () => void;
	testID: string;
	value: string;
}>): JSX.Element {
	const { theme } = useUnistyles();
	const isJson = kind === "json";

	styles.useVariants({ refused: isRefused });

	return (
		<TextInput
			accessibilityLabel={accessibilityLabel}
			// the JSON editor is the one control here that takes a newline, so it is
			// also the one whose return key must not dismiss the keyboard.
			autoCapitalize={isJson ? "none" : "sentences"}
			autoCorrect={!isJson}
			keyboardType={kind === "number" ? "numeric" : "default"}
			multiline={isJson}
			numberOfLines={isJson ? JSON_EDITOR_LINES : 1}
			onBlur={onCommit}
			onChangeText={onChangeText}
			placeholderTextColor={theme.colors.text.neutral.base}
			style={isJson ? styles.jsonInput : styles.input}
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
export const styles = StyleSheet.create((theme) => {
	// the refused border and ground are the refusal's second and third cues,
	// beside the marker on the label line and the message beneath — the treatment
	// has to survive a reader who cannot tell the destructive tone from the
	// neutral one. the same pair the sign-in form's flagged field uses, because
	// it is the same statement. `refused` is a closed boolean, so it is a variant
	// rather than a dynamic-function argument; `default` repeats the resting pair
	// so a body that never selected would still render a defined surface.
	//
	// built per style rather than shared between the two, so neither can be
	// changed by an edit meant for the other, and so nothing depends on how
	// Unistyles treats a variants object it is handed twice.
	const refusedVariants = () => ({
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
	});

	return {
		input: {
			...theme.typography.body,
			minHeight: 48,
			paddingHorizontal: theme.gap.sm,
			color: theme.colors.text.neutral.intense,
			borderWidth: theme.borderWidth.hairline,
			borderRadius: theme.radius.md,
			variants: refusedVariants(),
		},
		// raw JSON is machine-readable text, so it takes the monospace role and
		// opens several lines tall; the padding is vertical as well, since the text
		// no longer sits on one centred line.
		jsonInput: {
			...theme.typography.code,
			minHeight: 48,
			padding: theme.gap.sm,
			textAlignVertical: "top" as const,
			color: theme.colors.text.neutral.intense,
			borderWidth: theme.borderWidth.hairline,
			borderRadius: theme.radius.md,
			variants: refusedVariants(),
		},
	};
});
