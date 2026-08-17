import { describe, expect, it } from "@jest/globals";
import { render } from "@testing-library/react-native";
import type { CollectionRecord } from "~/collections/models/record";
import { resolveStyle } from "~/common/test-helpers/resolve-style";
import {
	CollectionRecordCard,
	RECORD_CARD_LINE,
} from "./collection-record-card";

const TITLED: CollectionRecord = {
	id: "6712a9f4c1b2e3d4",
	title: "Getting started with Payload",
	hasTitle: true,
	updatedLabel: "Updated 18 Jul 2026",
};

const UNTITLED: CollectionRecord = {
	id: "6712a9f4c1b2e3d4",
	title: "6712a9f4c1b2e3d4",
	hasTitle: false,
	updatedLabel: "Updated 18 Jul 2026",
};

/**
 * the pixel height of the nearest ancestor that fixes one, walking up from a
 * text node. a `<Text>` renders as a host element inside a composite one, so
 * the container that holds a row open is several levels above the match rather
 * than its direct parent.
 */
function enclosingFixedHeight(
	element: { parent: unknown; props: { style?: unknown } } | null,
): unknown {
	for (
		let node = element;
		node !== null && node !== undefined;
		node = node.parent as typeof element
	) {
		const { height } = resolveStyle(node.props?.style);

		if (height !== undefined) {
			return height;
		}
	}

	return undefined;
}

describe("<CollectionRecordCard>", () => {
	// every text style here spreads a theme role rather than setting its own
	// metrics, and a spread that resolved to nothing would type-check exactly the
	// same while dropping the size, the family, and the line height on every
	// screen. these assertions are the check that it resolves at run time.
	it("draws a titled record's title from the heading role", () => {
		const { getByText } = render(<CollectionRecordCard record={TITLED} />);

		expect(resolveStyle(getByText(TITLED.title).props.style)).toMatchObject({
			fontFamily: "InnovatorGrotesk-SemiBold",
			fontSize: 16,
			lineHeight: RECORD_CARD_LINE,
		});
	});

	// a record with no title-ish field shows its id as the title instead, in the
	// monospace role — whose line box matches the heading's, so the card is the
	// same height either way.
	it("draws a title-less record's id from the code role, on the same line box", () => {
		const { getByText } = render(<CollectionRecordCard record={UNTITLED} />);

		expect(resolveStyle(getByText(UNTITLED.id).props.style)).toMatchObject({
			fontFamily: "JetBrainsMono-Regular",
			fontSize: 14,
			lineHeight: RECORD_CARD_LINE,
		});
	});

	// the metadata row's own text is shorter than the fixed line box, so the row
	// is held open explicitly; without that, a title-less record — which renders
	// no chip — would produce a shorter card than a titled one and the list would
	// reflow when records replaced the skeleton.
	it("holds the metadata row open to the fixed line box", () => {
		const { getByText } = render(<CollectionRecordCard record={UNTITLED} />);
		const metaText = getByText(UNTITLED.updatedLabel as string);

		expect(resolveStyle(metaText.props.style)).toMatchObject({
			fontFamily: "InnovatorGrotesk-Regular",
			fontSize: 13,
			lineHeight: 18,
		});
		expect(enclosingFixedHeight(metaText)).toBe(RECORD_CARD_LINE);
	});

	// the chip is a fixed-height pill sized to the same line box; its text is the
	// monospace role, so nothing in the card carries a font size of its own.
	it("draws the id chip from the code role inside a line-box-tall pill", () => {
		const { getByText } = render(<CollectionRecordCard record={TITLED} />);
		const chipText = getByText(TITLED.id);

		expect(resolveStyle(chipText.props.style)).toMatchObject({
			fontFamily: "JetBrainsMono-Regular",
			fontSize: 14,
		});
		expect(enclosingFixedHeight(chipText)).toBe(RECORD_CARD_LINE);
	});
});
