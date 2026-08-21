/** the rectangle a tooltip points at, in window coordinates. */
export interface TooltipAnchor {
	readonly x: number;
	readonly y: number;
	readonly width: number;
	readonly height: number;
}

/** the window the bubble has to stay inside. */
export interface TooltipViewport {
	readonly width: number;
	readonly height: number;
	readonly insetTop: number;
	readonly insetBottom: number;
}

/** the measurements the placement is drawn to, all of them caller-supplied. */
export interface TooltipGeometry {
	/** the widest the bubble is drawn before the viewport narrows it. */
	readonly maxWidth: number;
	/** the space kept between the bubble and the anchor it points at. */
	readonly offset: number;
	/** the space kept between the bubble and every edge of the viewport. */
	readonly margin: number;
	/** the side of the square rotated into the arrow. */
	readonly arrowSize: number;
}

/** where the bubble and its arrow are drawn, in window coordinates. */
export interface TooltipPlacement {
	readonly bubbleLeft: number;
	readonly bubbleTop: number;
	readonly bubbleWidth: number;
	readonly arrowLeft: number;
	readonly arrowTop: number;
	/** which side of the anchor the bubble took, which the arrow points back from. */
	readonly side: "above" | "below";
}

export interface TooltipPlacementInput {
	readonly anchor: TooltipAnchor;
	/** the bubble's own height, measured at {@link tooltipBubbleWidth}. */
	readonly bubbleHeight: number;
	readonly geometry: TooltipGeometry;
	readonly viewport: TooltipViewport;
}

function clamp(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), Math.max(min, max));
}

/**
 * how wide the bubble is drawn.
 *
 * it depends on the viewport alone, never on the anchor or on the text, which
 * is what lets the bubble be laid out and measured *before* it is placed: its
 * height is a function of this width, and a width settled later would be a
 * width the measured height did not belong to.
 */
export function tooltipBubbleWidth(
	viewport: TooltipViewport,
	geometry: TooltipGeometry,
): number {
	return Math.max(
		0,
		Math.min(geometry.maxWidth, viewport.width - geometry.margin * 2),
	);
}

/**
 * where to draw a tooltip bubble pointing at `anchor`, and where its arrow sits
 * on the bubble's edge.
 *
 * the bubble hangs from its trailing end, so a mark in a row's top-right corner
 * opens a bubble that reaches back across the row rather than off the screen.
 * it hangs by the *arrow* rather than by its own corner: the preferred position
 * is the one putting the arrow a margin in from the bubble's trailing edge,
 * which keeps the arrow clear of the rounded corner it would otherwise sit on.
 * that preference gives way to the viewport — the bubble is clamped inside
 * `margin` at both sides, and the arrow then slides along the bubble's edge to
 * stay pointed at the anchor rather than travelling with it.
 *
 * vertically the bubble prefers to sit below the anchor and flips above it when
 * that would not fit — measured against the viewport's bottom inset, since the
 * app draws beneath the system bars and the last few points of the screen are
 * not somewhere a bubble may end up. when neither side fits, below is given up
 * first and the bubble is held off the top inset.
 */
export function placeTooltip({
	anchor,
	bubbleHeight,
	geometry,
	viewport,
}: TooltipPlacementInput): TooltipPlacement {
	const bubbleWidth = tooltipBubbleWidth(viewport, geometry);
	const anchorCentre = anchor.x + anchor.width / 2;
	const bubbleLeft = clamp(
		anchorCentre + geometry.arrowSize / 2 + geometry.margin - bubbleWidth,
		geometry.margin,
		viewport.width - geometry.margin - bubbleWidth,
	);
	const arrowLeft = clamp(
		anchorCentre - bubbleLeft - geometry.arrowSize / 2,
		geometry.margin,
		bubbleWidth - geometry.margin - geometry.arrowSize,
	);

	const below =
		anchor.y + anchor.height + geometry.offset + bubbleHeight <=
		viewport.height - viewport.insetBottom - geometry.margin;
	const bubbleTop = below
		? anchor.y + anchor.height + geometry.offset
		: Math.max(
				anchor.y - geometry.offset - bubbleHeight,
				viewport.insetTop + geometry.margin,
			);

	return {
		arrowLeft,
		// the square is centred on the bubble's edge, so half of it overlaps the
		// bubble and half of it points out at the anchor.
		arrowTop: below
			? bubbleTop - geometry.arrowSize / 2
			: bubbleTop + bubbleHeight - geometry.arrowSize / 2,
		bubbleLeft,
		bubbleTop,
		bubbleWidth,
		side: below ? "below" : "above",
	};
}
