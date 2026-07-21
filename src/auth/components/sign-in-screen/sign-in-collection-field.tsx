import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
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
						placeholderTextColor={theme.colors.textSecondary}
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
						<MaterialCommunityIcons
							color={theme.colors.accent}
							name="pencil-outline"
							size={20}
						/>
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
		rowGap: theme.gapSizes.x8,
	},
	hint: {
		color: theme.colors.textSecondary,
		fontSize: theme.fontSizes.sm,
	},
	input: {
		backgroundColor: theme.colors.backgroundElevated,
		borderColor: theme.colors.border,
		borderRadius: theme.radiusSizes.md,
		borderWidth: 1,
		color: theme.colors.textPrimary,
		fontSize: theme.fontSizes.md,
		minHeight: 48,
		paddingHorizontal: theme.gapSizes.x12,
	},
	label: {
		color: theme.colors.textSecondary,
		fontSize: theme.fontSizes.sm,
	},
	value: {
		color: theme.colors.textPrimary,
		flexGrow: 1,
		fontSize: theme.fontSizes.md,
	},
	valueRow: {
		alignItems: "center",
		columnGap: theme.gapSizes.x8,
		flexDirection: "row",
		minHeight: 40,
	},
}));
