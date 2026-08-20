import type { JSX, ReactNode } from "react";
import { useRef, useState } from "react";
import type { LayoutChangeEvent, View as ReactNativeView } from "react-native";
import { Modal, Pressable, Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import {
	placeTooltip,
	type TooltipAnchor,
	type TooltipGeometry,
	type TooltipPlacement,
	type TooltipViewport,
	tooltipBubbleWidth,
} from "~/collections/helpers/tooltip-placement";

/**
 * the widest the bubble is drawn. a fixed element dimension rather than a
 * spacing step: it is a measure — the line length one sentence reads
 * comfortably at — and the narrowest phone this app targets still leaves room
 * for it inside the screen margins.
 */
const BUBBLE_MAX_WIDTH = 260;

/**
 * the side of the square rotated 45° into the bubble's arrow, so the visible
 * triangle is about seven points across. also a fixed element dimension.
 */
const ARROW_SIZE = 10;

/**
 * a mark that explains itself when tapped: the caller's own content as the
 * trigger, and one sentence in a bubble anchored to it.
 *
 * the bubble is drawn inside a transparent `Modal` rather than beside the
 * trigger, which is what lets it escape the record's `ScrollView` — a bubble
 * rendered in the row would be clipped by the scroll view's bounds and by every
 * row after it. the Modal's own layer is also what makes the dismissing tap
 * cheap: one full-screen `Pressable` behind the bubble closes it without the
 * tap also reaching whatever sat under the finger.
 *
 * placement takes two passes and cannot take one. the trigger's position is
 * only knowable by measuring it in the window, and the bubble's height is only
 * knowable once it has been laid out at the width it will keep — so the bubble
 * is rendered unplaced and transparent, measured, and then placed. the Modal's
 * own fade covers the pass in between.
 *
 * opening is deliberately *not* gated on that measurement: the Modal becomes
 * visible on the press itself, so the bubble is in the tree from the first
 * frame and a measurement that never arrives leaves an open tooltip rather than
 * a tap that did nothing.
 */
export function CollectionRecordFieldTooltip({
	accessibilityLabel,
	children,
	testID,
	text,
}: Readonly<{
	/** what the trigger announces to a screen reader — normally `text` itself. */
	accessibilityLabel: string;
	/** the mark the caller draws as the trigger. */
	children: ReactNode;
	testID: string;
	/** the sentence the bubble opens with. */
	text: string;
}>): JSX.Element {
	const { rt, theme } = useUnistyles();
	const triggerRef = useRef<ReactNativeView>(null);
	const [isOpen, setIsOpen] = useState(false);
	const [anchor, setAnchor] = useState<TooltipAnchor | null>(null);
	const [bubbleHeight, setBubbleHeight] = useState<number | null>(null);

	const geometry: TooltipGeometry = {
		arrowSize: ARROW_SIZE,
		margin: theme.gap.md,
		maxWidth: BUBBLE_MAX_WIDTH,
		offset: theme.gap.xs,
	};
	const viewport: TooltipViewport = {
		height: rt.screen.height,
		insetBottom: rt.insets.bottom,
		insetTop: rt.insets.top,
		width: rt.screen.width,
	};
	const placement: TooltipPlacement | null =
		anchor === null || bubbleHeight === null
			? null
			: placeTooltip({ anchor, bubbleHeight, geometry, viewport });

	function open(): void {
		// the height is dropped rather than kept: the sentence is the same one,
		// but the screen it is measured against may have rotated since, and a
		// stale height would place the bubble against a size it no longer has.
		setBubbleHeight(null);
		setIsOpen(true);
		triggerRef.current?.measureInWindow((x, y, width, height) => {
			setAnchor({ height, width, x, y });
		});
	}

	function close(): void {
		setIsOpen(false);
		setAnchor(null);
		setBubbleHeight(null);
	}

	function measureBubble(event: LayoutChangeEvent): void {
		setBubbleHeight(event.nativeEvent.layout.height);
	}

	return (
		<>
			<Pressable
				accessibilityLabel={accessibilityLabel}
				accessibilityRole="button"
				hitSlop={theme.gap.xs}
				onPress={open}
				ref={triggerRef}
				style={({ pressed }) => [
					styles.trigger,
					pressed ? styles.triggerPressed : null,
				]}
				testID={testID}
			>
				{children}
			</Pressable>

			<Modal
				animationType="fade"
				onRequestClose={close}
				// `measureInWindow` reports the trigger against the whole window,
				// system bars included, because `app.json` puts this app edge to edge.
				// the Modal has to cover that same window for those coordinates to
				// mean anything inside it — under both bars on Android, or the
				// placement is off by whichever bar the Modal stopped short of.
				navigationBarTranslucent
				statusBarTranslucent
				transparent
				visible={isOpen}
			>
				<Pressable
					accessibilityLabel="Close"
					accessibilityRole="button"
					onPress={close}
					style={styles.scrim}
					testID={`${testID}-scrim`}
				/>
				<View
					onLayout={measureBubble}
					style={styles.bubble(
						tooltipBubbleWidth(viewport, geometry),
						placement?.bubbleLeft ?? 0,
						placement?.bubbleTop ?? 0,
						placement !== null,
					)}
					testID={`${testID}-bubble`}
				>
					<Text style={styles.text}>{text}</Text>
				</View>
				{placement === null ? null : (
					<View
						style={styles.arrow(
							placement.bubbleLeft + placement.arrowLeft,
							placement.arrowTop,
							placement.side,
						)}
					/>
				)}
			</Modal>
		</>
	);
}

const styles = StyleSheet.create((theme) => ({
	// drawn after the bubble so it paints over it: the two share one background,
	// so the seam where they overlap is invisible and only the arrow's two outer
	// edges carry a border.
	arrow: (left: number, top: number, side: "above" | "below") => ({
		position: "absolute" as const,
		left,
		top,
		width: ARROW_SIZE,
		aspectRatio: 1,
		backgroundColor: theme.colors.surface.neutral.highlight,
		borderColor: theme.colors.border.neutral.base,
		// a 45° turn puts the square's top-left corner at the top and its
		// bottom-right corner at the bottom, so the two edges facing away from the
		// bubble are top-and-left for an arrow pointing up and bottom-and-right for
		// one pointing down. `left`/`right` rather than `start`/`end` deliberately:
		// this is the square's own geometry, and a right-to-left layout that
		// mirrored the pair would put the border on the two edges the bubble
		// already covers.
		borderTopWidth: side === "below" ? theme.borderWidth.hairline : 0,
		borderLeftWidth: side === "below" ? theme.borderWidth.hairline : 0,
		borderBottomWidth: side === "above" ? theme.borderWidth.hairline : 0,
		borderRightWidth: side === "above" ? theme.borderWidth.hairline : 0,
		transform: [{ rotate: "45deg" }],
	}),
	// a dynamic function rather than a variant: every argument is an open runtime
	// value measured on the device. `isPlaced` is the exception and is carried
	// here anyway, because a variant and a dynamic function cannot share a style.
	bubble: (width: number, left: number, top: number, isPlaced: boolean) => ({
		position: "absolute" as const,
		left,
		top,
		width,
		padding: theme.gap.sm,
		backgroundColor: theme.colors.surface.neutral.highlight,
		borderColor: theme.colors.border.neutral.base,
		borderWidth: theme.borderWidth.hairline,
		borderRadius: theme.radius.md,
		// laid out to be measured before it is anywhere: shown at the top-left
		// corner would be a visible jump, and not rendered at all would be nothing
		// to measure.
		opacity: isPlaced ? 1 : 0,
	}),
	scrim: {
		...StyleSheet.absoluteFillObject,
	},
	text: {
		...theme.typography.caption,
		color: theme.colors.text.neutral.intense,
	},
	// the padding and the negative margin that cancels it are what give a mark
	// this small a target worth aiming at: the pressable box grows to reach the
	// surrounding surface's own edges while the mark stays in the corner and the
	// row's layout is unchanged. `hitSlop` reaches further still wherever the
	// platform honours it past a parent's bounds.
	trigger: {
		padding: theme.gap.sm,
		margin: -theme.gap.sm,
		flexShrink: 0,
	},
	// the codebase's standard pressed-opacity dip, and the whole of this mark's
	// press feedback: it is icon-only and has no fill or border to tint. a
	// separate style selected in the render prop rather than a dynamic-function
	// argument, so this stylesheet adds no row to the `pressed`-as-argument table
	// in docs/conventions/agent-skills.md — the same shape
	// `setting-menu-group-item.tsx` uses.
	triggerPressed: {
		opacity: 0.6,
	},
}));
