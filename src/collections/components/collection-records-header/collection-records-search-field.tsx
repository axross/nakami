import { Search, X } from "lucide-react-native";
import type { ComponentPropsWithRef, JSX } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { Pressable, TextInput, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

/** what the field says it searches, and what a screen reader announces it as. */
const SEARCH_PLACEHOLDER = "Search records";

/**
 * the field's fixed height — a deliberate geometry constant, not a typography
 * value. It is the touch target a control needs rather than a look: iOS asks
 * 44pt and Material 48dp, and one stylesheet serves both platforms, so the
 * larger of the two is what this takes, as the sign-in inputs and the
 * message-state button already do.
 *
 * exported because the section around it is what shrinks on scroll, and it
 * computes both of its heights from this. That the field itself never shrinks
 * is the point: a header that got smaller by taking its own control below the
 * touch-target floor would be trading the thing it exists to offer.
 */
export const SEARCH_FIELD_HEIGHT = 48;

/**
 * the record feed's search input: a magnifier, the text being typed, and — once
 * there is any — a control that empties it.
 *
 * the clear control is a real button with a label rather than a bare glyph,
 * because it is the only way back to the whole feed from a query that matched
 * nothing, and a screen reader reaching an unlabelled `X` learns nothing about
 * that. It appears only when there is something to clear, so the field's
 * resting state is the placeholder alone.
 *
 * `TextInput` handles no styling of its own beyond its text: the border, the
 * ground, and the height belong to the row around it, so the magnifier and the
 * clear control sit inside the same bordered surface the reader sees as one
 * field.
 */
export function CollectionRecordsSearchField({
	onChangeQuery,
	query,
	style,
	testID = "collection-records-search",
	...props
}: Readonly<
	Omit<ComponentPropsWithRef<typeof View>, "children" | "style"> & {
		query: string;
		onChangeQuery: (query: string) => void;
		style?: StyleProp<ViewStyle>;
	}
>): JSX.Element {
	const { theme } = useUnistyles();

	return (
		<View {...props} style={[styles.field, style]} testID={testID}>
			<Search color={theme.colors.text.neutral.base} size={18} />

			<TextInput
				accessibilityLabel={SEARCH_PLACEHOLDER}
				autoCapitalize="none"
				autoCorrect={false}
				onChangeText={onChangeQuery}
				placeholder={SEARCH_PLACEHOLDER}
				placeholderTextColor={theme.colors.text.neutral.base}
				// the feed follows what is typed rather than what is submitted, so the
				// return key has nothing to send and no next field to move to; it
				// labels the keyboard for what the field does and dismisses it.
				returnKeyType="search"
				style={styles.input}
				testID={`${testID}-input`}
				value={query}
			/>

			{query.length === 0 ? null : (
				<Pressable
					accessibilityLabel="Clear search"
					accessibilityRole="button"
					// the drawn control is narrower than a finger: 32pt against the
					// 44pt/48dp floor, which the row's own height satisfies on the long
					// side only. `hitSlop` widens what answers a tap without widening
					// the mark, the way the sign-in collection field's edit button does.
					hitSlop={8}
					onPress={() => onChangeQuery("")}
					style={({ pressed }) => styles.clear(pressed)}
					testID={`${testID}-clear`}
				>
					<X color={theme.colors.text.neutral.base} size={18} />
				</Pressable>
			)}
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	// a dynamic function rather than a variant: `pressed` is React Native's own
	// per-press argument, and the dip matches the record card's and the
	// collection row's, the app's other pressables.
	clear: (pressed: boolean) => ({
		alignItems: "center",
		justifyContent: "center",
		// the glyph is 18pt and the row is {@link SEARCH_FIELD_HEIGHT} tall, so the
		// control stretches to the row's full height and takes a width of its own:
		// the pressable area is the box around the mark rather than the mark itself.
		// that box is still under the touch-target floor on its short side, which is
		// what the `hitSlop` above is for — the drawn width stays 32pt so the mark
		// sits at the field's end rather than pushing the text away from it.
		alignSelf: "stretch",
		width: 32,
		opacity: pressed ? 0.6 : 1,
	}),
	field: {
		flexDirection: "row",
		alignItems: "center",
		columnGap: theme.gap.xs,
		height: SEARCH_FIELD_HEIGHT,
		paddingHorizontal: theme.gap.sm,
		backgroundColor: theme.colors.foundation.neutral.bare,
		borderColor: theme.colors.border.neutral.subtle,
		borderWidth: theme.borderWidth.hairline,
		borderRadius: theme.radius.md,
	},
	// no vertical padding of its own: React Native gives a `TextInput` some by
	// default on Android, which would make the row taller than the 48pt floor
	// above and leave the two platforms drawing different heights.
	input: {
		...theme.typography.body,
		flex: 1,
		minWidth: 0,
		paddingVertical: 0,
		color: theme.colors.text.neutral.intense,
	},
}));
