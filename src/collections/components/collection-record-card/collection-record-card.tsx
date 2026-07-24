import type { JSX } from "react";
import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { CollectionRecord } from "~/collections/models/record";

/**
 * The fixed line-box height shared by a record card's title, its metadata row,
 * and the id chip — the single value that makes a card's height deterministic.
 * Exported so the loading skeleton mirrors the exact same geometry.
 */
export const RECORD_CARD_LINE = 22;

/**
 * One record in a collection, as a non-interactive elevated card (the chosen
 * "card feed" design): the derived title over a metadata row — a monospace
 * record-id chip and the last-updated label. A title-less record renders its id
 * as the (monospace) title and omits the chip, so the id is never shown twice.
 * Browsing into a single record is a follow-up; the card is read-only.
 */
export function CollectionRecordCard({
	record,
}: Readonly<{ record: CollectionRecord }>): JSX.Element {
	const hasMeta = record.hasTitle || record.updatedLabel !== null;

	return (
		<View
			accessible
			accessibilityLabel={record.title}
			style={styles.card}
			testID={`collection-record-list-item-${record.id}`}
		>
			<Text
				numberOfLines={1}
				style={record.hasTitle ? styles.title : styles.titleFallback}
			>
				{record.title}
			</Text>

			{hasMeta ? (
				<View style={styles.meta}>
					{record.hasTitle ? (
						<View style={styles.chip}>
							<Text numberOfLines={1} style={styles.chipText}>
								{record.id}
							</Text>
						</View>
					) : null}
					{record.updatedLabel !== null ? (
						<Text numberOfLines={1} style={styles.metaText}>
							{record.updatedLabel}
						</Text>
					) : null}
				</View>
			) : null}
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	card: {
		backgroundColor: theme.colors.foundation.neutral.subtle,
		borderColor: theme.colors.border.neutral.subtle,
		borderRadius: theme.gap.sm,
		borderWidth: 1,
		gap: theme.gap.xs,
		paddingHorizontal: theme.gap.md,
		paddingVertical: theme.gap.sm,
	},
	chip: {
		alignItems: "center",
		backgroundColor: theme.colors.foundation.neutral.bare,
		borderColor: theme.colors.border.neutral.subtle,
		borderRadius: theme.gap.md,
		borderWidth: 1,
		// Fixed pill height (a fixed element dimension, not scale spacing) keeps
		// the chip compact around its 12px id text and equal to the row line box;
		// the theme's smallest gap step (xs: 8) as vertical padding would make the
		// pill far too tall.
		height: RECORD_CARD_LINE,
		justifyContent: "center",
		maxWidth: 140,
		paddingHorizontal: theme.gap.xs,
	},
	chipText: {
		color: theme.colors.text.neutral.base,
		fontFamily: theme.fonts.monospace,
		fontSize: 12,
	},
	meta: {
		alignItems: "center",
		columnGap: theme.gap.xs,
		flexDirection: "row",
	},
	// The title line and the metadata row share one fixed line box (matching the
	// chip's height), so a card's height is deterministic — every card is
	// paddingV + LINE + gap + LINE + paddingV tall regardless of title length or
	// whether a chip shows. The loading skeleton mirrors these exact metrics so
	// the list doesn't reflow when records arrive.
	metaText: {
		color: theme.colors.text.neutral.base,
		flexShrink: 1,
		fontFamily: theme.fonts.paragraph,
		fontSize: 13,
		lineHeight: RECORD_CARD_LINE,
	},
	title: {
		color: theme.colors.text.neutral.intense,
		fontFamily: theme.fonts.heading,
		fontSize: 16,
		lineHeight: RECORD_CARD_LINE,
	},
	titleFallback: {
		color: theme.colors.text.neutral.base,
		fontFamily: theme.fonts.monospace,
		fontSize: 14,
		lineHeight: RECORD_CARD_LINE,
	},
}));
