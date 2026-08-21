import { describe, expect, it } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";
import { Text } from "react-native";
import { CollectionRecordFieldTooltip } from "./collection-record-field-tooltip";

const TEXT = "Your account doesn't have permission to update this field.";

function renderTooltip() {
	return render(
		<CollectionRecordFieldTooltip
			accessibilityLabel={TEXT}
			testID="tooltip"
			text={TEXT}
		>
			<Text>mark</Text>
		</CollectionRecordFieldTooltip>,
	);
}

describe("<CollectionRecordFieldTooltip>", () => {
	it("draws its trigger and nothing else until it is tapped", () => {
		const { getByTestId, queryByTestId, queryByText } = renderTooltip();

		expect(getByTestId("tooltip")).toBeTruthy();
		expect(queryByTestId("tooltip-bubble")).toBeNull();
		expect(queryByText(TEXT)).toBeNull();
	});

	// the bubble's own position is not asserted here and cannot be: it is placed
	// from a window measurement and a laid-out height, neither of which the test
	// renderer produces. `placeTooltip` carries that arithmetic and is tested
	// directly — see tooltip-placement.test.ts.
	it("opens the bubble on the sentence when its trigger is tapped", () => {
		const { getByTestId, getByText } = renderTooltip();

		fireEvent.press(getByTestId("tooltip"));

		expect(getByTestId("tooltip-bubble")).toBeTruthy();
		expect(getByText(TEXT)).toBeTruthy();
	});

	it("closes the bubble when the layer behind it is tapped", () => {
		const { getByTestId, queryByTestId, queryByText } = renderTooltip();

		fireEvent.press(getByTestId("tooltip"));
		fireEvent.press(getByTestId("tooltip-scrim"));

		expect(queryByTestId("tooltip-bubble")).toBeNull();
		expect(queryByText(TEXT)).toBeNull();
	});

	// the sentence reaches a screen reader off the trigger itself, so it is heard
	// without the tooltip having to be opened at all.
	it("announces the sentence from the trigger", () => {
		const { getByTestId } = renderTooltip();
		const trigger = getByTestId("tooltip");

		expect(trigger.props.accessibilityLabel).toBe(TEXT);
		expect(trigger.props.accessibilityRole).toBe("button");
	});
});
