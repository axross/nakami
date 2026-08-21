import { describe, expect, it } from "@jest/globals";
import {
	placeTooltip,
	type TooltipAnchor,
	type TooltipGeometry,
	type TooltipViewport,
	tooltipBubbleWidth,
} from "~/collections/helpers/tooltip-placement";

const GEOMETRY: TooltipGeometry = {
	arrowSize: 10,
	margin: 16,
	maxWidth: 260,
	offset: 8,
};

/** a phone-sized window with a notch at the top and a home indicator below. */
const VIEWPORT: TooltipViewport = {
	height: 800,
	insetBottom: 34,
	insetTop: 44,
	width: 390,
};

/** a 12pt mark in the top-right corner of a row near the top of the screen. */
function markAt(x: number, y: number): TooltipAnchor {
	return { height: 12, width: 12, x, y };
}

function place(
	anchor: TooltipAnchor,
	bubbleHeight: number,
	viewport = VIEWPORT,
) {
	return placeTooltip({ anchor, bubbleHeight, geometry: GEOMETRY, viewport });
}

describe("tooltipBubbleWidth()", () => {
	it("takes its full width where the viewport has room for it", () => {
		expect(tooltipBubbleWidth(VIEWPORT, GEOMETRY)).toBe(260);
	});

	// the width is what the bubble is measured at, so it has to be settled from
	// the viewport alone — never from the anchor or the sentence.
	it("narrows to the viewport's margins on a screen too narrow for it", () => {
		expect(tooltipBubbleWidth({ ...VIEWPORT, width: 280 }, GEOMETRY)).toBe(248);
	});
});

describe("placeTooltip()", () => {
	describe("across the screen", () => {
		// the bubble hangs by its arrow rather than by its corner, so the arrow
		// never lands on the rounded end it would otherwise sit on.
		it("hangs the bubble a margin past the arrow under the anchor", () => {
			const placement = place(markAt(340, 200), 60);

			expect(placement.bubbleWidth).toBe(260);
			expect(placement.arrowLeft).toBe(260 - 16 - 10);
			expect(placement.bubbleLeft + placement.arrowLeft + 5).toBe(340 + 6);
		});

		it("holds the bubble off the leading edge when the anchor sits near it", () => {
			const placement = place(markAt(20, 200), 60);

			expect(placement.bubbleLeft).toBe(GEOMETRY.margin);
		});

		it("holds the bubble off the trailing edge when the anchor sits at it", () => {
			const placement = place(markAt(378, 200), 60);

			expect(placement.bubbleLeft).toBe(390 - 16 - 260);
			expect(placement.bubbleLeft + placement.bubbleWidth).toBe(390 - 16);
		});

		// the bubble stops at the margin, so the arrow is what keeps pointing at
		// the mark — it travels along the bubble's edge instead.
		it("keeps the arrow on the bubble when the anchor is past its edge", () => {
			const placement = place(markAt(20, 200), 60);

			expect(placement.arrowLeft).toBeGreaterThanOrEqual(GEOMETRY.margin);
			expect(placement.arrowLeft).toBeLessThanOrEqual(260 - 16 - 10);
		});
	});

	describe("above or below", () => {
		it("opens below the anchor where the screen has room beneath it", () => {
			const placement = place(markAt(340, 200), 60);

			expect(placement.side).toBe("below");
			expect(placement.bubbleTop).toBe(200 + 12 + 8);
		});

		it("flips above the anchor when the bubble would not fit beneath it", () => {
			const placement = place(markAt(340, 700), 60);

			expect(placement.side).toBe("above");
			expect(placement.bubbleTop).toBe(700 - 8 - 60);
		});

		// the app draws beneath the system bars, so the last points of the screen
		// are behind the home indicator rather than free space.
		it("counts the bottom inset as taken when choosing a side", () => {
			// 690 + 12 + 8 + h must clear 800 - 34 - 16, so 40 is the last height
			// that still fits beneath the mark.
			expect(place(markAt(340, 690), 40).side).toBe("below");
			expect(place(markAt(340, 690), 41).side).toBe("above");
		});

		it("holds a bubble too tall for either side off the top inset", () => {
			const placement = place(markAt(340, 500), 600);

			expect(placement.side).toBe("above");
			expect(placement.bubbleTop).toBe(VIEWPORT.insetTop + GEOMETRY.margin);
		});
	});

	describe("the arrow's own edge", () => {
		it("straddles the bubble's top edge when the bubble sits below", () => {
			const placement = place(markAt(340, 200), 60);

			expect(placement.arrowTop).toBe(placement.bubbleTop - 5);
		});

		it("straddles the bubble's bottom edge when the bubble sits above", () => {
			const placement = place(markAt(340, 700), 60);

			expect(placement.arrowTop).toBe(placement.bubbleTop + 60 - 5);
		});
	});
});
