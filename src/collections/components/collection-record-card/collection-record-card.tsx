import type { JSX } from "react";
import { Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import type { CollectionRecord } from "~/collections/models/record";

/**
 * The fixed line-box height shared by a record card's title row, its metadata
 * row, and the id chip — the single value that makes a card's height
 * deterministic. Exported so the loading skeleton mirrors the exact same
 * geometry.
 *
 * A deliberate geometry constant, not a typography value: it sizes elements,
 * and no text style sets it. It matches the 22pt line box that
 * `typography.heading` and `typography.code` already carry, so a title row is
 * exactly this tall on its own; only the metadata row — whose
 * `typography.caption` line box is shorter, and whose chip may be absent — has
 * to be held open to it explicitly.
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
		// the chip compact around its id text and equal to the row line box; the
		// theme's smallest gap step (xs: 8) as vertical padding would make the
		// pill far too tall.
		height: RECORD_CARD_LINE,
		justifyContent: "center",
		maxWidth: 140,
		paddingHorizontal: theme.gap.xs,
	},
	chipText: {
		...theme.typography.code,
		color: theme.colors.text.neutral.base,
	},
	// The title row and the metadata row are each one fixed line box, so a card's
	// height is deterministic — every card is paddingV + LINE + gap + LINE +
	// paddingV tall regardless of title length or whether a chip shows. The title
	// row gets there from its own text role's 22pt line box; this row is held
	// open explicitly, because its caption text is shorter than that and the chip
	// that would otherwise set the height is absent on a title-less record. The
	// loading skeleton mirrors these exact metrics so the list doesn't reflow
	// when records arrive.
	meta: {
		alignItems: "center",
		columnGap: theme.gap.xs,
		flexDirection: "row",
		height: RECORD_CARD_LINE,
	},
	metaText: {
		...theme.typography.caption,
		color: theme.colors.text.neutral.base,
		flexShrink: 1,
	},
	title: {
		...theme.typography.heading,
		color: theme.colors.text.neutral.intense,
	},
	titleFallback: {
		...theme.typography.code,
		color: theme.colors.text.neutral.base,
	},
}));
