import { Link } from "expo-router";
import { ChevronRight } from "lucide-react-native";
import type { ComponentProps, ComponentPropsWithRef, JSX } from "react";
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
 * the pressable row body: a monogram of the collection's initial, its name, and
 * a chevron. kept a separate component so `Link asChild` clones *this* wrapper
 * and threads its injected press/href props onto the root `Pressable` via
 * `...props`. wrapping the Unistyles-styled `Pressable` in `Link asChild`
 * directly drops the row's computed style — the clone takes over the ref
 * Unistyles applies styles through — collapsing the horizontal layout.
 */
function CollectionRow({
	collection,
	style,
	...props
}: Readonly<
	Omit<ComponentPropsWithRef<typeof Pressable>, "style" | "children"> & {
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
 * a single collection row that opens the collection's record list. navigation
 * is declarative via `Link`; the row body lives in
 * {@link CollectionRow} so `Link asChild` targets a wrapper component rather
 * than the Unistyles-styled `Pressable` directly (see that component's note).
 *
 * `style` is the one prop this row deliberately does **not** publish, against
 * the general rule that a component rendering a styled root accepts one.
 * `Link asChild` slots its child through `@radix-ui/react-slot`, which composes
 * a `style` by spreading it into an object literal — which throws in
 * development for the array form, and silently detaches a Unistyles style from
 * the updates it applies through its own reference. a `style` accepted here
 * would type-check and not work, which is the exact failure this component's
 * props contract exists to remove. size and place the row from the list's
 * `contentContainerStyle` instead.
 */
export function CollectionListItem({
	collection,
	...props
}: Readonly<Omit<ComponentProps<typeof CollectionRow>, "style">>): JSX.Element {
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
		flexShrink: 1,
		color: theme.colors.text.neutral.intense,
	},
	monogram: {
		alignItems: "center",
		justifyContent: "center",
		width: 34,
		aspectRatio: 1,
		backgroundColor: theme.colors.surface.accent.base,
		borderRadius: theme.radius.sm,
	},
	monogramText: {
		...theme.typography.heading,
		color: theme.colors.text.accent.base,
	},
	row: (pressed: boolean) => ({
		flexDirection: "row",
		alignItems: "center",
		columnGap: theme.gap.sm,
		minHeight: 56,
		paddingVertical: theme.gap.xs,
		paddingHorizontal: theme.gap.md,
		backgroundColor: theme.colors.foundation.neutral.subtle,
		opacity: pressed ? 0.6 : 1,
	}),
	spring: {
		flex: 1,
	},
}));
