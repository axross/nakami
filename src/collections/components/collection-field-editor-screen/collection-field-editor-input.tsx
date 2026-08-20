import type { JSX } from "react";
import { TextInput } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import type { DialogFieldKind } from "~/collections/helpers/record-fields";

/**
 * the editing area this screen exists to provide: the field's whole value, at
 * whatever height the sheet leaves it, in the treatment the record screen's own
 * controls use.
 *
 * it fills its parent rather than declaring a height. that is the difference
 * this change is for — the row it replaced was three lines by construction, and
 * a value that does not fit a line has to be edited somewhere that does not
 * impose one.
 *
 * unlike the row's inline control it does **not** commit on blur. blurring is
 * not finishing here: the keyboard closing, or a tap into the sheet's own
 * chrome, would otherwise queue a change the user had not asked to save. Save is
 * the only thing that commits.
 */
export function CollectionFieldEditorInput({
	accessibilityLabel,
	isFlagged,
	kind,
	onChangeText,
	testID,
	value,
}: Readonly<{
	accessibilityLabel: string;
	/** the text cannot be read back into a value, and the editor says so. */
	isFlagged: boolean;
	kind: DialogFieldKind;
	onChangeText: (text: string) => void;
	testID: string;
	value: string;
}>): JSX.Element {
	const { theme } = useUnistyles();
	const isJson = kind === "json";

	styles.useVariants({ flagged: isFlagged });

	return (
		<TextInput
			accessibilityLabel={accessibilityLabel}
			// both kinds here take a newline, so neither may have its return key
			// dismiss the keyboard. raw JSON additionally refuses the two
			// conveniences a prose field wants: an autocapitalised key breaks the
			// parse, and autocorrect rewrites identifiers.
			autoCapitalize={isJson ? "none" : "sentences"}
			autoCorrect={!isJson}
			autoFocus
			multiline
			onChangeText={onChangeText}
			placeholderTextColor={theme.colors.text.neutral.base}
			style={isJson ? styles.jsonEditor : styles.editor}
			testID={testID}
			value={value}
			// the editor is what the sheet is for, so it takes the focus the sheet
			// opens with rather than making a tap the price of typing.
		/>
	);
}

const styles = StyleSheet.create((theme) => {
	// the flagged pair is the same one the record screen's refused input draws,
	// because it is the same statement about the same field. `default` repeats
	// the resting pair so a body that never selected still renders a defined
	// surface.
	const flaggedVariants = () => ({
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
	});

	const frame = {
		flex: 1,
		padding: theme.gap.sm,
		textAlignVertical: "top" as const,
		color: theme.colors.text.neutral.intense,
		borderWidth: theme.borderWidth.hairline,
		borderRadius: theme.radius.md,
	};

	return {
		editor: {
			...frame,
			...theme.typography.body,
			variants: flaggedVariants(),
		},
		// raw JSON is machine-readable text and takes the monospace role, the same
		// one the row's preview and the read-only rows set a serialized value in.
		jsonEditor: {
			...frame,
			...theme.typography.code,
			variants: flaggedVariants(),
		},
	};
});
