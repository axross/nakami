import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Link } from "expo-router";
import type { JSX } from "react";
import { Pressable, Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import type { Collection } from "~/collections/models/collection";

/**
 * A single collection row: a monogram of the collection's initial, its name,
 * and a chevron. Pressing it opens the collection's (placeholder) detail
 * screen.
 */
export function CollectionListItem({
	collection,
}: Readonly<{ collection: Collection }>): JSX.Element {
	const { theme } = useUnistyles();
	const initial = collection.label.charAt(0).toUpperCase() || "#";

	return (
		<Link
			asChild
			href={{
				pathname: "/collections/[slug]",
				params: { slug: collection.slug },
			}}
		>
			<Pressable
				accessibilityLabel={collection.label}
				accessibilityRole="button"
				style={({ pressed }) => styles.row(pressed)}
				testID={`collection-list-item-${collection.slug}`}
			>
				<View style={styles.monogram}>
					<Text style={styles.monogramText}>{initial}</Text>
				</View>
				<Text numberOfLines={1} style={styles.label}>
					{collection.label}
				</Text>
				<View style={styles.spring} />
				<MaterialCommunityIcons
					color={theme.colors.textSecondary}
					name="chevron-right"
					size={22}
				/>
			</Pressable>
		</Link>
	);
}

const styles = StyleSheet.create((theme) => ({
	label: {
		color: theme.colors.textPrimary,
		flexShrink: 1,
		fontSize: theme.fontSizes.md,
	},
	monogram: {
		alignItems: "center",
		aspectRatio: 1,
		backgroundColor: theme.colors.accentMuted,
		borderRadius: theme.radiusSizes.sm,
		justifyContent: "center",
		width: 34,
	},
	monogramText: {
		color: theme.colors.accent,
		fontSize: theme.fontSizes.md,
		fontWeight: "600",
	},
	row: (pressed: boolean) => ({
		alignItems: "center",
		backgroundColor: theme.colors.backgroundElevated,
		columnGap: theme.gapSizes.x12,
		flexDirection: "row",
		minHeight: 56,
		opacity: pressed ? 0.6 : 1,
		paddingHorizontal: theme.gapSizes.x16,
		paddingVertical: theme.gapSizes.x8,
	}),
	spring: {
		flex: 1,
	},
}));
