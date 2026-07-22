import { Link } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import type { ComponentPropsWithoutRef, JSX } from "react";
import {
	Pressable,
	type StyleProp,
	Text,
	View,
	type ViewStyle,
} from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import type { Collection } from "~/collections/models/collection";

/**
 * The pressable row body: a monogram of the collection's initial, its name, and
 * a chevron. Kept a separate component so `Link asChild` clones *this* wrapper
 * and threads its injected press/href props onto the root `Pressable` via
 * `...props`. Wrapping the Unistyles-styled `Pressable` in `Link asChild`
 * directly drops the row's computed style — the clone takes over the ref
 * Unistyles applies styles through — collapsing the horizontal layout.
 */
function CollectionRow({
	collection,
	style,
	...props
}: Readonly<
	Omit<ComponentPropsWithoutRef<typeof Pressable>, "style" | "children"> & {
		collection: Collection;
		style?: StyleProp<ViewStyle>;
	}
>): JSX.Element {
	const { theme } = useUnistyles();
	const initial = collection.label.charAt(0).toUpperCase() || "#";

	return (
		<Pressable
			accessibilityLabel={collection.label}
			accessibilityRole="link"
			testID={`collection-list-item-${collection.slug}`}
			{...props}
			style={({ pressed }) => [styles.row(pressed), style]}
		>
			<View style={styles.monogram}>
				<Text style={styles.monogramText}>{initial}</Text>
			</View>
			<Text numberOfLines={1} style={styles.label}>
				{collection.label}
			</Text>
			<View style={styles.spring} />
			<ChevronRight color={theme.colors.textSecondary} size={22} />
		</Pressable>
	);
}

/**
 * A single collection row that opens the collection's (placeholder) detail
 * screen. Navigation is declarative via `Link`; the row body lives in
 * {@link CollectionRow} so `Link asChild` targets a wrapper component rather
 * than the Unistyles-styled `Pressable` directly (see that component's note).
 */
export function CollectionListItem({
	collection,
}: Readonly<{ collection: Collection }>): JSX.Element {
	return (
		<Link
			asChild
			href={{
				pathname: "/collections/[slug]",
				params: { slug: collection.slug },
			}}
		>
			<CollectionRow collection={collection} />
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
