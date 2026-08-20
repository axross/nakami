import type { ComponentPropsWithRef, JSX } from "react";
import { useEffect } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { Text, View } from "react-native";
import Animated, {
	useAnimatedStyle,
	useReducedMotion,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import {
	CollectionRecordsSearchField,
	SEARCH_FIELD_HEIGHT,
} from "~/collections/components/collection-records-header/collection-records-search-field";
import type { RecordCount } from "~/collections/helpers/record-count-label";
import { describeRecordCount } from "~/collections/helpers/record-count-label";

/**
 * the record feed's search section: the field with the count line beneath it,
 * fixed directly under the screen's own header.
 *
 * the two belong together because they answer each other — the line says what
 * the field just did to the feed — and keeping them in one block is what stops
 * the count reading as a caption over the cards while a search is running. The
 * section carries no outer margin and no corner of its own, so it meets the
 * screen header edge to edge and reads as an extension of it rather than as a
 * card floating above the feed.
 *
 * it stays put while the feed scrolls, so a search is reachable from anywhere
 * in a collection rather than only from the top — and it gives that room back
 * when the reader is going somewhere: scrolling down shrinks it to the field
 * alone, scrolling back up restores the count. The field itself never shrinks
 * (see {@link SEARCH_FIELD_HEIGHT}); what the collapsed form drops is the
 * padding around it and the line beneath it.
 *
 * the section stays through every state a search has, the one that matched
 * nothing included, so the query that emptied the feed can always be edited or
 * cleared.
 */
export function CollectionRecordsHeader({
	collapsed = false,
	count,
	onChangeQuery,
	query,
	style,
	testID = "collection-records-header",
	...props
}: Readonly<
	Omit<ComponentPropsWithRef<typeof View>, "children" | "style"> & {
		/** what the count line reports, or nothing where there is no count to give. */
		count?: RecordCount;
		query: string;
		onChangeQuery: (query: string) => void;
		/** `true` while the reader is scrolling down through the feed. */
		collapsed?: boolean;
		style?: StyleProp<ViewStyle>;
	}
>): JSX.Element {
	const { theme } = useUnistyles();
	const reduceMotion = useReducedMotion();
	// 0 is the full section, 1 the shrunk one; every animated value below is read
	// off this single position, so the height and the fade cannot come apart
	// mid-transition.
	const shrink = useSharedValue(collapsed ? 1 : 0);

	// both heights are the token arithmetic rather than two more numbers to keep
	// in step: the padding pair, the field, and — expanded — the gap and the
	// caption line box the count occupies.
	const expandedHeight =
		theme.gap.sm * 2 +
		SEARCH_FIELD_HEIGHT +
		theme.gap.xs +
		theme.typography.caption.lineHeight;
	const collapsedHeight = theme.gap.xs * 2 + SEARCH_FIELD_HEIGHT;

	useEffect(() => {
		const target = collapsed ? 1 : 0;

		// the interaction tier rather than the skeleton's ambient one: this is a
		// response to the reader's own scroll, and it honours a device asking for
		// reduced motion by taking the new size outright.
		shrink.value = reduceMotion
			? target
			: withTiming(target, {
					duration: theme.duration.fast,
					easing: theme.easing.standard,
				});
	}, [
		collapsed,
		reduceMotion,
		shrink,
		theme.duration.fast,
		theme.easing.standard,
	]);

	const size = useAnimatedStyle(() => ({
		height: expandedHeight + (collapsedHeight - expandedHeight) * shrink.value,
		paddingTop: theme.gap.sm + (theme.gap.xs - theme.gap.sm) * shrink.value,
		paddingBottom: theme.gap.sm + (theme.gap.xs - theme.gap.sm) * shrink.value,
	}));

	// the count fades as the section closes over it rather than vanishing at the
	// end, so the two halves of the shrink read as one movement.
	const fade = useAnimatedStyle(() => ({ opacity: 1 - shrink.value }));

	return (
		<View {...props} style={[styles.section, style]} testID={testID}>
			<Animated.View style={[styles.body, size]}>
				<CollectionRecordsSearchField
					onChangeQuery={onChangeQuery}
					query={query}
				/>

				{count === undefined ? null : (
					<Animated.View style={fade}>
						<Text style={styles.count} testID={`${testID}-count`}>
							{describeRecordCount(count)}
						</Text>
					</Animated.View>
				)}
			</Animated.View>
		</View>
	);
}

const styles = StyleSheet.create((theme, rt) => ({
	// clipped rather than merely shorter: the count line is still laid out at its
	// own height while the section closes over it, and this is what hides it on
	// the way rather than letting it spill past the border below.
	body: {
		rowGap: theme.gap.xs,
		overflow: "hidden",
	},
	// the same caption role and muted ink the count line carried when it was a
	// bare header above the feed; only what encloses it has changed.
	count: {
		...theme.typography.caption,
		paddingHorizontal: theme.gap.xs,
		color: theme.colors.text.neutral.base,
	},
	// deliberately no radius and no side borders: the section is fixed against
	// the screen header, so its only edge is the one facing the feed, and a
	// corner anywhere would read as a card that had come loose from it. the fill
	// is the elevated one the stack header itself takes, for the same reason.
	//
	// this is the surface that spans the screen, so the horizontal safe-area
	// inset is its own rather than the feed's — floored against the same gutter
	// the cards below already sit in, per docs/conventions/safe-areas.md. it
	// belongs here rather than on the animated body inside it, because this is
	// the box that actually meets the screen's edges. written as longhands, as
	// that document requires of an edge an inset applies to.
	section: {
		paddingStart: Math.max(rt.insets.left, theme.gap.md),
		paddingEnd: Math.max(rt.insets.right, theme.gap.md),
		backgroundColor: theme.colors.foundation.neutral.subtle,
		borderBottomColor: theme.colors.border.neutral.subtle,
		borderBottomWidth: theme.borderWidth.hairline,
	},
}));
