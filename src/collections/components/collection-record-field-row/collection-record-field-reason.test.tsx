import { describe, expect, it } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";
import { describeReadOnlyReason } from "~/collections/helpers/record-field-display";
import type { RecordFieldReadOnlyReason } from "~/collections/helpers/record-fields";
import { CollectionRecordFieldReason } from "./collection-record-field-reason";

const REASONS: readonly RecordFieldReadOnlyReason[] = [
	"server-assigned",
	"permission",
	"rich-text",
	"no-value",
];

function renderReason(reason: RecordFieldReadOnlyReason) {
	return render(
		<CollectionRecordFieldReason reason={reason} testID="reason" />,
	);
}

describe("<CollectionRecordFieldReason>", () => {
	// the mark stands alone on screen, so the sentence it stands for must not be
	// on screen beside it — that was the whole cost this change set out to save.
	it.each(REASONS)("draws %s as a mark and not as words", (reason) => {
		const { getByTestId, queryByText } = renderReason(reason);

		expect(getByTestId("reason")).toBeTruthy();
		expect(queryByText(describeReadOnlyReason(reason))).toBeNull();
	});

	it.each(REASONS)("opens %s's own sentence when tapped", (reason) => {
		const { getByTestId, getByText } = renderReason(reason);

		fireEvent.press(getByTestId("reason"));

		expect(getByText(describeReadOnlyReason(reason))).toBeTruthy();
	});

	it.each(REASONS)("announces %s from the mark itself", (reason) => {
		const { getByTestId } = renderReason(reason);

		expect(getByTestId("reason").props.accessibilityLabel).toBe(
			describeReadOnlyReason(reason),
		);
	});
});
