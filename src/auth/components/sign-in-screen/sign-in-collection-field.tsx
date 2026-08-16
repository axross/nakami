import { Pencil } from "lucide-react-native";
import type { ComponentPropsWithRef, JSX, Ref } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { SignInFieldError } from "~/auth/components/sign-in-screen/sign-in-field-error";

/**
 * The Collection slug field. Because most Payload instances use `users`, it
 * shows the value as plain text with a pencil affordance by default and only
 * becomes an editable input once the pencil is pressed — keeping the common
 * case zero-interaction while staying configurable.
 *
 * `inputRef` reaches the editable input rather than this field's root, so the
 * screen's error summary can focus it; the root's own `ref` stays available
 * through the spread props. A caller that focuses the input while the field is
 * still showing its value has to switch `editing` on in the same press.
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
		editing: boolean;
		error?: string;
		inputRef?: Ref<TextInput>;
		onEdit: () => void;
		onChangeText: (value: string) => void;
		onBlur?: () => void;
	}
>): JSX.Element {
	const { theme } = useUnistyles();

	// Rendered from one place but placed in both branches, so the message stays
	// directly under whatever the field is currently showing rather than below
	// the hint that follows the input.
	const message =
		error === undefined ? null : (
			<SignInFieldError message={error} testID="sign-in-error-collection" />
		);

	return (
		<View {...props} style={[styles.field, style]}>
			<Text style={styles.label}>Collection</Text>

			{editing ? (
				<>
					<TextInput
						accessibilityLabel="Collection"
						autoCapitalize="none"
						autoCorrect={false}
						autoFocus
						onBlur={onBlur}
						onChangeText={onChangeText}
						placeholder="users"
						placeholderTextColor={theme.colors.text.neutral.base}
						ref={inputRef}
						style={[styles.input, error !== undefined && styles.inputFlagged]}
						testID="sign-in-collection-input"
						value={value}
					/>
					{message}
					<Text style={styles.hint}>
						The slug of your Payload auth collection.
					</Text>
				</>
			) : (
				<>
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
					{message}
				</>
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
	inputFlagged: {
		backgroundColor: theme.colors.foundation.destructive.subtle,
		borderColor: theme.colors.border.destructive.base,
	},
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
