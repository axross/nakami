import type { JSX } from "react";
import { useUnistyles } from "react-native-unistyles";
import { CollectionRecordFieldTooltip } from "~/collections/components/collection-record-field-row/collection-record-field-tooltip";
import {
	describeReadOnlyReason,
	readOnlyReasonIcon,
} from "~/collections/helpers/record-field-display";
import type { RecordFieldReadOnlyReason } from "~/collections/helpers/record-fields";

/**
 * the mark's own size — a fixed element dimension, not a spacing step. it is
 * deliberately below the caption role's 13, because this is a mark on a value
 * rather than a word beside one: at the size of the surrounding text it would
 * read as a second piece of content competing with the value, which is what the
 * sentence it replaced did.
 */
const ICON_SIZE = 12;

/**
 * why a field cannot be edited, as a mark in the corner of its value surface.
 *
 * a mark rather than the sentence, because the sentence is the same four
 * sentences on every record and a reader learns them by the second row — while
 * the space it took is the value's, which is different every time. tapping the
 * mark opens the sentence, so nothing is lost by someone who has not learned
 * them yet.
 *
 * drawn in the neutral ink rather than a tone of its own: a field the account
 * may not edit is a fact about the record, not a fault, and the destructive ink
 * on this screen already means a save the server refused.
 */
export function CollectionRecordFieldReason({
	reason,
	testID,
}: Readonly<{
	reason: RecordFieldReadOnlyReason;
	testID: string;
}>): JSX.Element {
	const { theme } = useUnistyles();
	const Icon = readOnlyReasonIcon(reason);
	const text = describeReadOnlyReason(reason);

	return (
		<CollectionRecordFieldTooltip
			accessibilityLabel={text}
			testID={testID}
			text={text}
		>
			<Icon color={theme.colors.text.neutral.base} size={ICON_SIZE} />
		</CollectionRecordFieldTooltip>
	);
}
