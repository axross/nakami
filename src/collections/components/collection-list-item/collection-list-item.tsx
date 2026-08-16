import { Link } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import type { ComponentProps, ComponentPropsWithoutRef, JSX } from "react";
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
			<ChevronRight color={theme.colors.text.neutral.base} size={22} />
		</Pressable>
	);
}

/**
 * A single collection row that opens the collection's record list. Navigation
 * is declarative via `Link`; the row body lives in
 * {@link CollectionRow} so `Link asChild` targets a wrapper component rather
 * than the Unistyles-styled `Pressable` directly (see that component's note).
 */
export function CollectionListItem({
	collection,
	...props
}: Readonly<ComponentProps<typeof CollectionRow>>): JSX.Element {
	return (
		<Link
			asChild
			href={{
				pathname: "/collections/[slug]",
				params: { slug: collection.slug },
			}}
		>
			<CollectionRow collection={collection} {...props} />
		</Link>
	);
}

const styles = StyleSheet.create((theme) => ({
	label: {
		...theme.typography.body,
		color: theme.colors.text.neutral.intense,
		flexShrink: 1,
	},
	monogram: {
		alignItems: "center",
		aspectRatio: 1,
		backgroundColor: theme.colors.surface.accent.base,
		borderRadius: theme.gap.xs,
		justifyContent: "center",
		width: 34,
	},
	monogramText: {
		...theme.typography.heading,
		color: theme.colors.text.accent.base,
	},
	row: (pressed: boolean) => ({
		alignItems: "center",
		backgroundColor: theme.colors.foundation.neutral.subtle,
		columnGap: theme.gap.sm,
		flexDirection: "row",
		minHeight: 56,
		opacity: pressed ? 0.6 : 1,
		paddingHorizontal: theme.gap.md,
		paddingVertical: theme.gap.xs,
	}),
	spring: {
		flex: 1,
	},
}));
