import { Pencil } from "lucide-react-native";
import type { ComponentPropsWithRef, JSX, Ref } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { SignInFieldError } from "~/auth/components/sign-in-screen/sign-in-field-error";
import { signInInputStyle } from "~/auth/components/sign-in-screen/sign-in-input-style";
import { signInFieldLabel } from "~/auth/helpers/sign-in-form";

/**
 * The Collection slug field. Because most Payload instances use `users`, it
 * shows the value as plain text with a pencil affordance by default and only
 * becomes an editable input once the pencil is pressed — keeping the common
 * case zero-interaction while staying configurable.
 *
 * `inputRef` reaches the editable input rather than this field's root, so the
 * screen's error summary can focus it; the root's own `ref` stays available
 * through the spread props.
 *
 * `error` belongs to the editable input and renders beneath it, and the props
 * are discriminated on `editing` so it can only be passed alongside `editing:
 * true`. That is the only state the value can be wrong in — it starts non-empty
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
	...props
}: Readonly<
	Omit<ComponentPropsWithRef<typeof View>, "children" | "onBlur"> & {
		value: string;
		inputRef?: Ref<TextInput>;
		onEdit: () => void;
		onChangeText: (value: string) => void;
		onBlur?: () => void;
	} & ({ editing: true; error?: string } | { editing: false; error?: never })
>): JSX.Element {
	const { theme } = useUnistyles();

	return (
		<View {...props} style={[styles.field, style]}>
			<Text style={styles.label}>Collection</Text>

			{editing ? (
				<>
					<TextInput
						accessibilityLabel={signInFieldLabel("Collection", error)}
						autoCapitalize="none"
						autoCorrect={false}
						autoFocus
						onBlur={onBlur}
						onChangeText={onChangeText}
						placeholder="users"
						placeholderTextColor={theme.colors.text.neutral.base}
						ref={inputRef}
						style={styles.input(error !== undefined)}
						testID="sign-in-collection-input"
						value={value}
					/>
					{error === undefined ? null : (
						<SignInFieldError
							message={error}
							testID="sign-in-error-collection"
						/>
					)}
					<Text style={styles.hint}>
						The slug of your Payload auth collection.
					</Text>
				</>
			) : (
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
			)}
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	editButton: {
		alignItems: "center",
		height: 40,
		justifyContent: "center",
		width: 40,
	},
	field: {
		rowGap: theme.gap.xs,
	},
	hint: {
		...theme.typography.caption,
		color: theme.colors.text.neutral.base,
	},
	// Shared with the screen's own inputs, so the flagged treatment has one
	// definition rather than one per stylesheet.
	input: (flagged: boolean) => signInInputStyle(theme, flagged),
	label: {
		...theme.typography.caption,
		color: theme.colors.text.neutral.base,
	},
	value: {
		...theme.typography.body,
		color: theme.colors.text.neutral.intense,
		flexGrow: 1,
	},
	valueRow: {
		alignItems: "center",
		columnGap: theme.gap.xs,
		flexDirection: "row",
		minHeight: 40,
	},
}));
