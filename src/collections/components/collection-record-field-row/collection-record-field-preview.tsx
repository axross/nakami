import { Maximize2 } from "lucide-react-native";
import type { JSX } from "react";
import { Pressable, Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import {
	describePreviewValue,
	toEditorText,
} from "~/collections/helpers/record-field-display";
import type { RecordFieldKind } from "~/collections/helpers/record-fields";

/**
 * how many lines of the value the box shows. it is a fixed element dimension
 * rather than a spacing step, and it is what makes every one of these boxes the
 * same height whatever it holds — three line boxes plus the padding, decided
 * here rather than by the longest value on the screen.
 */
const PREVIEW_LINES = 3;

/** the expand mark's own size — a fixed element dimension, not a spacing step. */
const ICON_SIZE = 18;

/** what the box shows for a value with no text in it at all. */
const EMPTY_PREVIEW = "Empty";

/**
 * the control behind a field whose value does not fit a line: a newline-carrying
 * string, and an array or object edited as raw JSON.
 *
 * it is drawn as the input beside it — the same ground, the same hairline
 * border, the same corner — because it stands where that input stood and shows
 * the same value. **it is a button.** nothing here can be typed into, and it
 * says so to assistive technology rather than leaving a screen-reader user to
 * find out by focusing a text field that is not one. the mark at its end is the
 * second half of that statement for everyone else.
 *
 * three lines is the whole of the preview and a longer value is cut off at the
 * third: this is where a value is recognised, not where it is read. the value is
 * the caller's — the row derives it from the queue rather than from the record,
 * so a change still on its way and one the server refused are both previewed
 * here rather than being replaced by the value they were meant to supersede.
 */
export function CollectionRecordFieldPreview({
	fieldLabel,
	isRefused,
	kind,
	onPress,
	testID,
	value,
}: Readonly<{
	fieldLabel: string;
	isRefused: boolean;
	kind: RecordFieldKind;
	onPress: () => void;
	testID: string;
	value: unknown;
}>): JSX.Element {
	const { theme } = useUnistyles();
	const text = toEditorText(kind, value);
	const isEmpty = text.length === 0;
	// what is announced is not always what is drawn: raw JSON is summarised for
	// a screen reader, where the serialized text is unreadable aloud.
	const announced = isEmpty ? EMPTY_PREVIEW : describePreviewValue(kind, value);

	styles.useVariants({ refused: isRefused });

	return (
		<Pressable
			accessibilityHint="Opens an editor for this field."
			accessibilityLabel={`${fieldLabel}: ${announced}`}
			accessibilityRole="button"
			onPress={onPress}
			style={styles.surface}
			testID={testID}
		>
			<Text
				// the third line is where the preview ends, and the value keeps its
				// own line breaks up to it: a JSON object read as one wrapped run of
				// text is not recognisable as the object it is.
				numberOfLines={PREVIEW_LINES}
				style={isEmpty ? styles.empty : styles.value(kind)}
			>
				{isEmpty ? EMPTY_PREVIEW : text}
			</Text>
			{/* the mark keeps the first line rather than centring itself against a
			    block whose height does not change. */}
			<View style={styles.mark}>
				<Maximize2 color={theme.colors.text.neutral.base} size={ICON_SIZE} />
			</View>
		</Pressable>
	);
}

const styles = StyleSheet.create((theme) => {
	// three line boxes of the two roles this box sets its value in. `body` and
	// `code` share a 22pt line box — see `typography` in src/unistyles.ts — which
	// is what lets one height cover a text preview and a JSON one, so a screen of
	// these rows does not step in height as the kinds alternate.
	const previewHeight = theme.typography.body.lineHeight * PREVIEW_LINES;

	return {
		empty: {
			...theme.typography.body,
			flexShrink: 1,
			color: theme.colors.text.neutral.base,
		},
		mark: {
			flexShrink: 0,
		},
		// the editable text control's own surface, at the height three lines of it
		// would occupy. a reader should not have to tell this apart from the input
		// above it to know what the field holds — only to know where to type, which
		// is what the mark and the button role are for.
		surface: {
			flexDirection: "row",
			alignItems: "flex-start",
			justifyContent: "space-between",
			columnGap: theme.gap.sm,
			height: previewHeight + theme.gap.sm * 2,
			padding: theme.gap.sm,
			borderWidth: theme.borderWidth.hairline,
			borderRadius: theme.radius.md,
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
		// a dynamic function rather than a variant: a screen draws one of these per
		// row from one component body, and `useVariants` selects once per body — so
		// a text preview and a JSON one in the same list could not each have been
		// expressed as variants of the same style.
		value: (kind: RecordFieldKind) => ({
			// raw JSON is machine-readable text and takes the monospace role, the
			// same one the read-only rows set a serialized value in.
			...(kind === "json" ? theme.typography.code : theme.typography.body),
			flexShrink: 1,
			color: theme.colors.text.neutral.intense,
		}),
	};
});
