import type { ComponentPropsWithRef, JSX } from "react";
import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { formatUpdatedAt } from "~/collections/helpers/format-updated-at";
import type { CollectionRecord } from "~/collections/models/record";

/**
 * the fixed line-box height shared by a record card's title row, its metadata
 * row, and the id chip — the single value that makes a card's height
 * deterministic. exported so the loading skeleton mirrors the exact same
 * geometry.
 *
 * a deliberate geometry constant, not a typography value: it sizes elements,
 * and no text style sets it. it matches the 22pt line box that
 * `typography.heading` already carries, so a title row is exactly this tall on
 * its own; only the metadata row — whose `typography.caption` line box is
 * shorter — has to be held open to it explicitly.
 */
export const RECORD_CARD_LINE = 22;

// the title row's stand-in for a record that has no title-ish field at all. it
// is copy the server never sent, so it is written once here rather than
// wherever the row happens to be assembled.
const UNTITLED_TITLE = "Untitled";

/**
 * one record in a collection, as a non-interactive elevated card (the chosen
 * "card feed" design): the derived title over a metadata row carrying a
 * monospace record-id chip on the left and the last-updated label on the right.
 * every card carries the chip, and a record with no title of its own takes
 * {@link UNTITLED_TITLE} in the title's own type, so the two card shapes read
 * as one feed. browsing into a single record is a follow-up; the card is
 * read-only.
 */
export function CollectionRecordCard({
	record,
	style,
	...props
}: Readonly<
	Omit<ComponentPropsWithRef<typeof View>, "children"> & {
		record: CollectionRecord;
	}
>): JSX.Element {
	// formatted here rather than on the view model: the label is relative, so one
	// built at parse time would freeze in the query cache and go on reading as it
	// did when the page was fetched.
	const updatedLabel =
		record.updatedAt === null
			? null
			: formatUpdatedAt(record.updatedAt, Date.now());

	return (
		<View
			accessible
			// a title-less card shows placeholder copy, so the id is what actually
			// identifies the record and is what the announcement has to carry.
			accessibilityLabel={record.hasTitle ? record.title : record.id}
			testID={`collection-record-list-item-${record.id}`}
			{...props}
			style={[styles.card, style]}
		>
			<Text numberOfLines={1} style={styles.title(record.hasTitle)}>
				{record.hasTitle ? record.title : UNTITLED_TITLE}
			</Text>

			<View style={styles.meta}>
				<View style={styles.chip}>
					<Text numberOfLines={1} style={styles.chipText}>
						{record.id}
					</Text>
				</View>
				{updatedLabel !== null ? (
					<Text numberOfLines={1} style={styles.metaText}>
						{updatedLabel}
					</Text>
				) : null}
			</View>
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	card: {
		gap: theme.gap.xs,
		paddingVertical: theme.gap.sm,
		paddingHorizontal: theme.gap.md,
		backgroundColor: theme.colors.foundation.neutral.subtle,
		borderColor: theme.colors.border.neutral.subtle,
		borderWidth: theme.borderWidth.hairline,
		borderRadius: theme.radius.md,
	},
	// the pill takes whatever width the update label leaves and shrinks past it
	// rather than pushing the label off the row — a 24-character id is the only
	// thing identifying a title-less record, so it is capped by the row it sits
	// in rather than by a fixed width of its own.
	chip: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		flexShrink: 1,
		// fixed pill height (a fixed element dimension, not scale spacing) keeps
		// the chip compact around its id text and equal to the row line box; the
		// theme's smallest gap step (xs: 8) as vertical padding would make the
		// pill far too tall.
		height: RECORD_CARD_LINE,
		paddingHorizontal: theme.gap.xs,
		backgroundColor: theme.colors.foundation.neutral.bare,
		borderColor: theme.colors.border.neutral.subtle,
		borderWidth: theme.borderWidth.hairline,
		borderRadius: theme.radius.pill,
	},
	chipText: {
		...theme.typography.code,
		flexShrink: 1,
		color: theme.colors.text.neutral.base,
	},
	// the title row and the metadata row are each one fixed line box, so a card's
	// height is deterministic — every card is paddingV + LINE + gap + LINE +
	// paddingV tall regardless of title length. the title row gets there from its
	// own text role's 22pt line box; this row is held open explicitly, because
	// its caption text is shorter than that. the chip keeps the start of the row
	// and the update label the end, so the two read in the same places on every
	// card. the loading skeleton mirrors these exact metrics so the list doesn't
	// reflow when records arrive.
	meta: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		columnGap: theme.gap.xs,
		height: RECORD_CARD_LINE,
	},
	// never the element that gives way: the label is short and its whole value is
	// in reading it, so the chip beside it is what shrinks.
	metaText: {
		...theme.typography.caption,
		flexShrink: 0,
		color: theme.colors.text.neutral.base,
	},
	// one style for both cases rather than two roles: a missing title is an
	// absence to mark, not a second kind of title, so the fallback keeps the
	// heading role whole and differs in ink alone.
	title: (hasTitle: boolean) => ({
		...theme.typography.heading,
		color: hasTitle
			? theme.colors.text.neutral.intense
			: theme.colors.text.neutral.base,
	}),
}));
