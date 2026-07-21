import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useRouter } from "expo-router";
import { type JSX, useCallback } from "react";
import { Pressable, Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import type { Collection } from "~/collections/models/collection";

/**
 * A single collection row: a monogram of the collection's initial, its name,
 * and a chevron. Pressing it opens the collection's (placeholder) detail
 * screen. Navigation goes through `router.push` on a plain `Pressable` rather
 * than a `Link asChild` wrapper: wrapping a Unistyles-styled `Pressable`
 * directly in `Link asChild` drops the row's computed style (the clone takes
 * the ref Unistyles applies styles through), collapsing the horizontal layout.
 */
export function CollectionListItem({
	collection,
}: Readonly<{ collection: Collection }>): JSX.Element {
	const { theme } = useUnistyles();
	const router = useRouter();
	const initial = collection.label.charAt(0).toUpperCase() || "#";

	const onPress = useCallback(() => {
		router.push({
			pathname: "/collections/[slug]",
			params: { slug: collection.slug },
		});
	}, [router, collection.slug]);

	return (
		<Pressable
			accessibilityLabel={collection.label}
			accessibilityRole="button"
			onPress={onPress}
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
