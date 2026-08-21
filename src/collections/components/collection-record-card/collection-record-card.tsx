import { useRouter } from "expo-router";
import type { ComponentPropsWithRef, JSX } from "react";
import { Pressable, Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { formatUpdatedAt } from "~/collections/helpers/format-updated-at";
import type { CollectionRecord } from "~/collections/models/record";

/**
 * the fixed line-box height shared by a record card's title row and its
 * metadata row — the single value that makes a card's height deterministic.
 * exported so the loading skeleton mirrors the exact same geometry.
 *
 * a deliberate geometry constant, not a typography value: it sizes elements,
 * and no text style sets it. it matches the 22pt line box that
 * `typography.heading` already carries, so a title row is exactly this tall on
 * its own; only the metadata row — whose two 18pt roles are both shorter — has
 * to be held open to it explicitly.
 */
export const RECORD_CARD_LINE = 22;

// the title row's stand-in for a record that has no title-ish field at all. it
// is copy the server never sent, so it is written once here rather than
// wherever the row happens to be assembled.
const UNTITLED_TITLE = "Untitled";

/**
 * one record in a collection, as an elevated card (the chosen "card feed"
 * design) that opens that record: the derived title over a metadata row
 * carrying the record's id on the left and the last-updated label on the right.
 * both ends of that row sit at the same supporting tier — the id in monospace,
 * the label in the reading face, on one shared 18pt line box. every card
 * carries the id, and a record with no title of its own takes
 * {@link UNTITLED_TITLE} in the title's own type, so the two card shapes read
 * as one feed.
 *
 * it navigates imperatively rather than through `Link asChild`, which the
 * sibling collection card uses. that pattern needs the styled `Pressable`
 * wrapped in a plain component for the clone to target, and it costs the
 * wrapper its `style` prop — `Link` slots its child through a slot that
 * composes `style` by spreading it, which detaches a Unistyles style from the
 * reference it applies updates through (see collection-list-item's own note).
 * This card publishes `style`, and a push is what the feed needs; `useRouter`
 * gives it that without either cost.
 */
export function CollectionRecordCard({
	record,
	slug,
	style,
	...props
}: Readonly<
	Omit<ComponentPropsWithRef<typeof Pressable>, "children" | "style"> & {
		record: CollectionRecord;
		/** the collection the record belongs to — half of the route it opens. */
		slug: string;
		style?: ComponentPropsWithRef<typeof View>["style"];
	}
>): JSX.Element {
	const router = useRouter();
	styles.useVariants({ hasTitle: record.hasTitle });

	// formatted here rather than on the view model: the label is relative, so one
	// built at parse time would freeze in the query cache and go on reading as it
	// did when the page was fetched.
	const updatedLabel =
		record.updatedAt === null
			? null
			: formatUpdatedAt(record.updatedAt, Date.now());

	return (
		<Pressable
			accessible
			{...props}
			// everything below the spread is what the card *is*, so it wins over
			// whatever a caller passes: the push is the card's whole purpose, and a
			// caller handing in an `onPress` of its own would silently disable
			// navigation. the announcement and the test id are derived from the
			// record for the same reason — a title-less card shows placeholder copy,
			// so the id is what actually identifies the record and is what the
			// announcement has to carry. (the sibling collection card spreads last
			// instead, because `Link asChild` clones it and its injected press props
			// have to land.)
			accessibilityLabel={record.hasTitle ? record.title : record.id}
			accessibilityRole="button"
			onPress={() => {
				router.push({
					pathname: "/collections/[slug]/[recordId]",
					params: { slug, recordId: record.id },
				});
			}}
			testID={`collection-record-list-item-${record.id}`}
			style={({ pressed }) => [styles.card(pressed), style]}
		>
			<Text numberOfLines={1} style={styles.title}>
				{record.hasTitle ? record.title : UNTITLED_TITLE}
			</Text>

			<View style={styles.meta}>
				<Text numberOfLines={1} style={styles.id}>
					{record.id}
				</Text>
				{updatedLabel !== null ? (
					<Text numberOfLines={1} style={styles.metaText}>
						{updatedLabel}
					</Text>
				) : null}
			</View>
		</Pressable>
	);
}

/**
 * this card's stylesheet, exported for one reason. the jest mock for Unistyles
 * strips `variants` from every stylesheet and stubs `useVariants` to a no-op,
 * so under test a titled card and a title-less one resolve the same title
 * colour and no assertion on the two inks can fail. the selection is the one
 * thing still observable, and a test spies on `useVariants` through this
 * reference — see collection-record-card.test.tsx. it is not a styling API, and
 * nothing outside that test should consume it.
 */
export const styles = StyleSheet.create((theme) => ({
	// a dynamic function rather than a variant: a feed draws every card from this
	// one component body, and `useVariants` selects once per body — so one
	// pressed card could not have been expressed without dimming the rest. the
	// dip matches the collection card's, the app's other list control.
	card: (pressed: boolean) => ({
		gap: theme.gap.xs,
		paddingVertical: theme.gap.sm,
		paddingHorizontal: theme.gap.md,
		backgroundColor: theme.colors.foundation.neutral.subtle,
		borderColor: theme.colors.border.neutral.subtle,
		borderWidth: theme.borderWidth.hairline,
		borderRadius: theme.radius.md,
		opacity: pressed ? 0.6 : 1,
	}),
	// bare text rather than a filled, bordered chip: the id is supporting detail,
	// and a fill and a border would draw a boundary the row has none of. it takes
	// `codeCaption` — the role for machine-readable text supporting something
	// else — whose 18pt line box is the update label's own, so the two ends of
	// the row read at one tier and sit on one baseline. it takes whatever width
	// the label leaves and truncates rather than pushing the label off the row: a
	// 24-character id is the only thing identifying a title-less record, so it is
	// capped by the row it sits in rather than by a width of its own.
	id: {
		...theme.typography.codeCaption,
		flexShrink: 1,
		color: theme.colors.text.neutral.base,
	},
	// the title row and the metadata row are each one fixed line box, so a card's
	// height is deterministic — every card is paddingV + LINE + gap + LINE +
	// paddingV tall regardless of title length. the title row gets there from its
	// own text role's 22pt line box; this row is held open explicitly, because
	// both of its 18pt roles are shorter than that. the id keeps the start of the
	// row and the update label the end, so the two read in the same places on
	// every card. the loading skeleton mirrors these exact metrics so the list
	// doesn't reflow when records arrive.
	meta: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		columnGap: theme.gap.xs,
		height: RECORD_CARD_LINE,
		// the label never shrinks, so at a large accessibility text size it can
		// outgrow the row once the id has given up all its width. clipping at the
		// row keeps it inside the card's border rather than painting past it on
		// iOS and being cut by the parent on Android.
		overflow: "hidden",
	},
	// never the element that gives way: the label is short and its whole value is
	// in reading it, so the id beside it is what shrinks.
	metaText: {
		...theme.typography.caption,
		flexShrink: 0,
		color: theme.colors.text.neutral.base,
	},
	// one style for both cases rather than two roles: a missing title is an
	// absence to mark, not a second kind of title, so the fallback keeps the
	// heading role whole and differs in ink alone. `hasTitle` is a closed
	// boolean, so it is a variant rather than a dynamic-function argument;
	// `default` repeats the titled ink so a body that never selected would still
	// render a defined colour.
	title: {
		...theme.typography.heading,
		variants: {
			hasTitle: {
				default: {
					color: theme.colors.text.neutral.intense,
				},
				false: {
					color: theme.colors.text.neutral.base,
				},
				true: {
					color: theme.colors.text.neutral.intense,
				},
			},
		},
	},
}));
