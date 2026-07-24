import { Pencil } from "lucide-react-native";
import type { JSX } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

interface SignInCollectionFieldProps {
	readonly value: string;
	readonly editing: boolean;
	readonly onEdit: () => void;
	readonly onChangeText: (value: string) => void;
}

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
}: SignInCollectionFieldProps): JSX.Element {
	const { theme } = useUnistyles();

	return (
		<View style={styles.field}>
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
		color: theme.colors.text.neutral.base,
		fontFamily: theme.fonts.paragraph,
		fontSize: 13,
	},
	input: {
		backgroundColor: theme.colors.foundation.neutral.subtle,
		borderColor: theme.colors.border.neutral.subtle,
		borderRadius: theme.gap.sm,
		borderWidth: 1,
		color: theme.colors.text.neutral.intense,
		fontFamily: theme.fonts.paragraph,
		fontSize: 16,
		minHeight: 48,
		paddingHorizontal: theme.gap.sm,
	},
	label: {
		color: theme.colors.text.neutral.base,
		fontFamily: theme.fonts.label,
		fontSize: 13,
	},
	value: {
		color: theme.colors.text.neutral.intense,
		flexGrow: 1,
		fontFamily: theme.fonts.paragraph,
		fontSize: 16,
	},
	valueRow: {
		alignItems: "center",
		columnGap: theme.gap.xs,
		flexDirection: "row",
		minHeight: 40,
	},
}));
