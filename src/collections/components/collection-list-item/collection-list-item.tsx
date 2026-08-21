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
import { getCollectionIcon } from "~/collections/helpers/collection-icon";
import type { Collection } from "~/collections/models/collection";

/**
 * the pressable card body: an icon guessed from the collection's slug, its name,
 * and a chevron. kept a separate component so `Link asChild` clones *this*
 * wrapper and threads its injected press/href props onto the root `Pressable` via
 * `...props`. wrapping the Unistyles-styled `Pressable` in `Link asChild`
 * directly drops the card's computed style — the clone takes over the ref
 * Unistyles applies styles through — collapsing the horizontal layout.
 */
function CollectionCard({
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
	const Icon = getCollectionIcon(collection.slug);

	return (
		<Pressable
			accessibilityLabel={collection.label}
			accessibilityRole="link"
			testID={`collection-list-item-${collection.slug}`}
			{...props}
			style={({ pressed }) => [styles.card(pressed), style]}
		>
			<View style={styles.mark}>
				<Icon color={theme.colors.text.neutral.base} size={20} />
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
 * a single collection card that opens the collection's record list. it is drawn
 * as the record feed's card — the same fill, hairline border, radius, and
 * padding a `CollectionRecordCard` carries — so the two list screens one
 * navigation step apart read as one app rather than as two. navigation is
 * declarative via `Link`; the card body lives in {@link CollectionCard} so
 * `Link asChild` targets a wrapper component rather than the Unistyles-styled
 * `Pressable` directly (see that component's note).
 *
 * `style` is the one prop this card deliberately does **not** publish, against
 * the general rule that a component rendering a styled root accepts one.
 * `Link asChild` slots its child through `@radix-ui/react-slot`, which composes
 * a `style` by spreading it into an object literal — which throws in
 * development for the array form, and silently detaches a Unistyles style from
 * the updates it applies through its own reference. a `style` accepted here
 * would type-check and not work, which is the exact failure this component's
 * props contract exists to remove. space and inset the card from the list's
 * `contentContainerStyle` instead, the way the record feed does.
 */
export function CollectionListItem({
	collection,
	...props
}: Readonly<
	Omit<ComponentProps<typeof CollectionCard>, "style">
>): JSX.Element {
	return (
		<Link
			asChild
			href={{
				pathname: "/collections/[slug]",
				params: { slug: collection.slug },
			}}
		>
			<CollectionCard collection={collection} {...props} />
		</Link>
	);
}

const styles = StyleSheet.create((theme) => ({
	// the record card's own container, property for property (see
	// collection-record-card), with the horizontal layout this card's single
	// line of content needs on top. `minHeight` outlives the 34pt mark that sets
	// the height today: it is the touch-target floor, so a later change to the
	// mark cannot quietly shrink the target below it. the loading skeleton
	// mirrors these metrics, or the list would shift when the collections
	// arrive.
	card: (pressed: boolean) => ({
		flexDirection: "row",
		alignItems: "center",
		columnGap: theme.gap.sm,
		minHeight: 56,
		paddingVertical: theme.gap.sm,
		paddingHorizontal: theme.gap.md,
		backgroundColor: theme.colors.foundation.neutral.subtle,
		borderColor: theme.colors.border.neutral.subtle,
		borderWidth: theme.borderWidth.hairline,
		borderRadius: theme.radius.md,
		opacity: pressed ? 0.6 : 1,
	}),
	label: {
		...theme.typography.body,
		flexShrink: 1,
		color: theme.colors.text.neutral.intense,
	},
	mark: {
		alignItems: "center",
		justifyContent: "center",
		width: 34,
		aspectRatio: 1,
		backgroundColor: theme.colors.surface.neutral.base,
		borderRadius: theme.radius.sm,
	},
	spring: {
		flex: 1,
	},
}));
