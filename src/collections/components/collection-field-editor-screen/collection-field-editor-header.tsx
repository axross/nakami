import type { JSX } from "react";
import { Pressable, Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

/**
 * the editor's own header, inside the sheet rather than on the navigator: the
 * discarding control at the start, the field's label in the middle, and the
 * saving control at the end.
 *
 * it is drawn here rather than configured as a stack header because the sheet
 * has no navigator header of its own to hang two controls on, and because the
 * pair are the whole of what this screen does — putting them where the eye
 * already is costs less than a header bar that repeats the field's name.
 *
 * `Save` is a **tinted chip rather than a solid accent fill**, and that is a
 * measurement rather than a preference: the app's filled button pairs
 * `text.onAccent` with `solid.accent.base`, which is 3.07:1 in both themes and
 * fails WCAG AA for a 16pt label. The accent surface under `text.accent.intense`
 * measures 10.85:1 in light and 11.42:1 in dark while still reading as the
 * primary of the two controls. Both are existing tokens.
 */
export function CollectionFieldEditorHeader({
	label,
	onCancel,
	onSave,
}: Readonly<{
	label: string;
	onCancel: () => void;
	onSave: () => void;
}>): JSX.Element {
	return (
		<View style={styles.header}>
			<Pressable
				accessibilityRole="button"
				hitSlop={styles.hitSlop}
				onPress={onCancel}
				style={styles.cancel}
				testID="collection-field-editor-cancel"
			>
				<Text style={styles.cancelLabel}>Cancel</Text>
			</Pressable>
			{/* the label rather than the Payload name: the name is beneath the
			    header, beside the editor it identifies. */}
			<Text numberOfLines={1} style={styles.title}>
				{label}
			</Text>
			<Pressable
				accessibilityRole="button"
				onPress={onSave}
				style={styles.save}
				testID="collection-field-editor-save"
			>
				<Text style={styles.saveLabel}>Save</Text>
			</Pressable>
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	cancel: {
		flexShrink: 0,
	},
	cancelLabel: {
		...theme.typography.body,
		color: theme.colors.text.neutral.base,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		columnGap: theme.gap.sm,
		minHeight: 56,
		paddingHorizontal: theme.gap.md,
	},
	// the two controls are text rather than boxes, so the 48pt target every
	// control on the record screen keeps is extended past the ink rather than
	// drawn. the chip below is already 40 tall and takes the same extension to
	// clear the same minimum.
	hitSlop: {
		bottom: theme.gap.sm,
		left: theme.gap.sm,
		right: theme.gap.sm,
		top: theme.gap.sm,
	},
	save: {
		flexShrink: 0,
		paddingHorizontal: theme.gap.md,
		paddingVertical: theme.gap.xs + 1,
		backgroundColor: theme.colors.surface.accent.base,
		borderRadius: theme.radius.md,
	},
	saveLabel: {
		...theme.typography.heading,
		color: theme.colors.text.accent.intense,
	},
	// the label is the middle of three and the only one that may give way: the
	// two controls state what this screen can do, and a clipped verb is worse
	// than a clipped field name.
	title: {
		...theme.typography.heading,
		flexShrink: 1,
		textAlign: "center",
		color: theme.colors.text.neutral.intense,
	},
}));
