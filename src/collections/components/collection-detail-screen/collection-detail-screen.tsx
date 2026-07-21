import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import type { JSX } from "react";
import { Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

/**
 * Placeholder for a collection's record list. Browsing records ships in a
 * follow-up issue; this confirms the tapped collection and sets expectations.
 */
export function CollectionDetailScreen({
	label,
}: Readonly<{ label: string }>): JSX.Element {
	const { theme } = useUnistyles();

	return (
		<View style={styles.root} testID="collection-detail-screen">
			<View style={styles.mark}>
				<MaterialCommunityIcons
					color={theme.colors.accent}
					name="format-list-bulleted"
					size={34}
				/>
			</View>

			<Text style={styles.title}>Records coming soon</Text>
			<Text style={styles.subtitle}>
				Browsing the records in {label} lands in a follow-up update.
			</Text>
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	mark: {
		alignItems: "center",
		aspectRatio: 1,
		backgroundColor: theme.colors.backgroundElevated,
		borderRadius: theme.radiusSizes.lg,
		justifyContent: "center",
		marginBottom: theme.gapSizes.x8,
		width: 66,
	},
	root: {
		alignItems: "center",
		backgroundColor: theme.colors.background,
		flex: 1,
		justifyContent: "center",
		padding: theme.gapSizes.x24,
		rowGap: theme.gapSizes.x8,
	},
	subtitle: {
		color: theme.colors.textSecondary,
		fontSize: theme.fontSizes.md,
		maxWidth: 280,
		textAlign: "center",
	},
	title: {
		color: theme.colors.textPrimary,
		fontSize: theme.fontSizes.lg,
		fontWeight: "600",
	},
}));
