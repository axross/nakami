import { Pencil } from "lucide-react-native";
import type { ComponentPropsWithRef, JSX } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

/**
 * The Collection slug field. Because most Payload instances use `users`, it
 * shows the value as plain text with a pencil affordance by default and only
 * becomes an editable input once the pencil is pressed — keeping the common
 * case zero-interaction while staying configurable.
 */
export function SignInCollectionField({
	value,
	editing,
	onEdit,
	onChangeText,
	style,
	...props
}: Readonly<
	Omit<ComponentPropsWithRef<typeof View>, "children"> & {
		value: string;
		editing: boolean;
		onEdit: () => void;
		onChangeText: (value: string) => void;
	}
>): JSX.Element {
	const { theme } = useUnistyles();

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
						onChangeText={onChangeText}
						placeholder="users"
						placeholderTextColor={theme.colors.text.neutral.base}
						style={styles.input}
						testID="sign-in-collection-input"
						value={value}
					/>
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
