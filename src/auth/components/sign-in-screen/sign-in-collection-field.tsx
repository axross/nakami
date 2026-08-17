import { Pencil } from "lucide-react-native";
import type { JSX, Ref } from "react";
import type { StyleProp, TextInput, ViewStyle } from "react-native";
import { Pressable, Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { SignInTextField } from "~/auth/components/sign-in-screen/sign-in-text-field";

/**
 * the Collection slug field. because most Payload instances use `users`, it
 * shows the value as plain text with a pencil affordance by default and only
 * becomes an editable input once the pencil is pressed — keeping the common
 * case zero-interaction while staying configurable.
 *
 * once editing, it is an ordinary `SignInTextField` with a hint: the input, its
 * flagged treatment, and its message are the screen's, not this component's, so
 * a retune of any of them reaches all four fields at once.
 *
 * the props are explicit rather than based on a root element's, because the two
 * states have different roots — a `SignInTextField` while editing and a `View`
 * while showing the value — so no single base type could describe both without
 * one of them silently dropping what it was handed. `inputRef` reaches the
 * editable input so the screen's error summary can focus it.
 *
 * `error` belongs to the editable input and renders beneath it, and the props
 * are discriminated on `editing` so it can only be passed alongside `editing:
 * true`. that is the only state the value can be wrong in — it starts non-empty
 * and is only ever changed through this input — and pinning it in the type is
 * what stops a later change from producing a message that renders nowhere while
 * still being counted by the summary, whose press would then focus a null ref
 * and do nothing.
 */
export function SignInCollectionField({
	value,
	editing,
	error,
	inputRef,
	onEdit,
	onChangeText,
	onBlur,
	style,
}: Readonly<
	{
		value: string;
		inputRef?: Ref<TextInput>;
		onEdit: () => void;
		onChangeText: (value: string) => void;
		onBlur?: () => void;
		style?: StyleProp<ViewStyle>;
	} & ({ editing: true; error?: string } | { editing: false; error?: never })
>): JSX.Element {
	const { theme } = useUnistyles();

	if (editing) {
		return (
			<SignInTextField
				autoCapitalize="none"
				autoCorrect={false}
				autoFocus
				error={error}
				errorTestID="sign-in-error-collection"
				hint="The slug of your Payload auth collection."
				inputRef={inputRef}
				label="Collection"
				onBlur={onBlur}
				onChangeText={onChangeText}
				placeholder="users"
				style={style}
				testID="sign-in-collection-input"
				value={value}
			/>
		);
	}

	return (
		<View style={[styles.field, style]}>
			<Text style={styles.label}>Collection</Text>

			<View style={styles.valueRow}>
				<Text style={styles.value} testID="sign-in-collection-value">
					{value}
				</Text>
				<Pressable
					accessibilityLabel="Edit collection"
					accessibilityRole="button"
					hitSlop={8}
					onPress={onEdit}
					style={styles.editButton}
					testID="sign-in-collection-edit"
				>
					<Pencil color={theme.colors.text.accent.base} size={20} />
				</Pressable>
			</View>
		</View>
	);
}

// only the value state is styled here; the editable state is a
// `SignInTextField` and brings its own. the field shell and its label are the
// two rules the two states share, and they are repeated rather than extracted
// into a third part for two declarations.
const styles = StyleSheet.create((theme) => ({
	editButton: {
		alignItems: "center",
		justifyContent: "center",
		width: 40,
		height: 40,
	},
	field: {
		rowGap: theme.gap.xs,
	},
	label: {
		...theme.typography.caption,
		color: theme.colors.text.neutral.base,
	},
	value: {
		...theme.typography.body,
		flexGrow: 1,
		color: theme.colors.text.neutral.intense,
	},
	valueRow: {
		flexDirection: "row",
		alignItems: "center",
		columnGap: theme.gap.xs,
		minHeight: 40,
	},
}));
