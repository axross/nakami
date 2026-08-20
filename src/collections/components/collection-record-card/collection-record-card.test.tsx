import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	jest,
} from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";
import type { CollectionRecord } from "~/collections/models/record";
import { resolveStyle } from "~/common/test-helpers/resolve-style";
import { themes } from "~/unistyles";
import {
	CollectionRecordCard,
	RECORD_CARD_LINE,
	styles,
} from "./collection-record-card";

// the card navigates imperatively, so the router is what a press is observed
// through. the `mock` prefix is what lets the hoisted factory close over it.
const mockRouterPush = jest.fn();

jest.mock("expo-router", () => ({
	useRouter: () => ({ push: mockRouterPush }),
}));

const SLUG = "posts";

const HOUR = 60 * 60 * 1_000;

const TITLED: CollectionRecord = {
	id: "6712a9f4c1b2e3d4",
	title: "Getting started with Payload",
	hasTitle: true,
	updatedAt: Date.now() - 5 * HOUR,
};

// `title` still carries the id, the way `deriveRecordTitle` reports a fallback;
// the card is what decides not to draw it there.
const UNTITLED: CollectionRecord = {
	id: "66c0a1f7ee1490fd",
	title: "66c0a1f7ee1490fd",
	hasTitle: false,
	updatedAt: Date.now() - 5 * HOUR,
};

/**
 * the resolved style of the nearest ancestor whose own style satisfies
 * `matches`, walking up from a rendered node. a `<Text>` renders as a host
 * element inside a composite one, so the container that holds a row open is
 * several levels above the match rather than its direct parent.
 */
type Node = {
	parent: unknown;
	props: { style?: unknown };
	children?: readonly unknown[];
} | null;

function enclosingNode(
	element: Node,
	matches: (style: Record<string, unknown>) => boolean,
): Node {
	for (
		let node = element;
		node !== null && node !== undefined;
		node = node.parent as Node
	) {
		if (matches(resolveStyle(node.props?.style))) {
			return node;
		}
	}

	return null;
}

function enclosingStyle(
	element: Node,
	matches: (style: Record<string, unknown>) => boolean,
): Record<string, unknown> {
	return resolveStyle(enclosingNode(element, matches)?.props?.style);
}

const hasHeight = (style: Record<string, unknown>): boolean =>
	style.height !== undefined;

const isMetaRow = (style: Record<string, unknown>): boolean =>
	style.justifyContent === "space-between";

describe("<CollectionRecordCard>", () => {
	beforeEach(() => {
		mockRouterPush.mockClear();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	// the card is the only way into a record: the feed is where a reader is, and
	// nothing else on the screen addresses one.
	it("opens the record it stands for when pressed", () => {
		const { getByTestId } = render(
			<CollectionRecordCard record={TITLED} slug={SLUG} />,
		);

		fireEvent.press(getByTestId(`collection-record-list-item-${TITLED.id}`));

		expect(mockRouterPush).toHaveBeenCalledTimes(1);
		expect(mockRouterPush).toHaveBeenCalledWith({
			pathname: "/collections/[slug]/[recordId]",
			params: { slug: SLUG, recordId: TITLED.id },
		});
	});

	// the props spread is what lets a caller add to the card; it must not let one
	// take the card apart. an `onPress` landing over the push would leave a
	// control that looks exactly the same and opens nothing.
	it("keeps its own navigation, announcement, and test id over a caller's", () => {
		const onPress = jest.fn();
		const { getByTestId, queryByTestId } = render(
			<CollectionRecordCard
				accessibilityLabel="Something else"
				accessibilityRole="text"
				onPress={onPress}
				record={TITLED}
				slug={SLUG}
				testID="somewhere-else"
			/>,
		);
		const card = getByTestId(`collection-record-list-item-${TITLED.id}`);

		fireEvent.press(card);

		expect(mockRouterPush).toHaveBeenCalledTimes(1);
		expect(onPress).not.toHaveBeenCalled();
		expect(queryByTestId("somewhere-else")).toBeNull();
		expect(card.props.accessibilityLabel).toBe(TITLED.title);
		expect(card.props.accessibilityRole).toBe("button");
	});

	it("announces itself as a control", () => {
		const { getByTestId } = render(
			<CollectionRecordCard record={TITLED} slug={SLUG} />,
		);

		expect(
			getByTestId(`collection-record-list-item-${TITLED.id}`).props
				.accessibilityRole,
		).toBe("button");
	});

	// every text style here spreads a theme role rather than setting its own
	// metrics, and a spread that resolved to nothing would type-check exactly the
	// same while dropping the size, the family, and the line height on every
	// screen. these assertions are the check that it resolves at run time.
	it("draws a titled record's title from the heading role", () => {
		const { getByText } = render(
			<CollectionRecordCard record={TITLED} slug={SLUG} />,
		);

		expect(resolveStyle(getByText(TITLED.title).props.style)).toMatchObject({
			fontFamily: "InnovatorGrotesk-SemiBold",
			fontSize: 16,
			lineHeight: RECORD_CARD_LINE,
		});
	});

	// a record with no title-ish field takes placeholder copy in the title's own
	// type: an absence to mark, not a second kind of title. the type is what this
	// asserts — the two are compared property by property rather than each
	// against a literal, and the ink is the one thing allowed to differ.
	it("draws a title-less record's fallback title in the title role", () => {
		const titled = render(<CollectionRecordCard record={TITLED} slug={SLUG} />);
		const untitled = render(
			<CollectionRecordCard record={UNTITLED} slug={SLUG} />,
		);

		expect(resolveStyle(untitled.getByText("Untitled").props.style)).toEqual(
			resolveStyle(titled.getByText(TITLED.title).props.style),
		);
	});

	// the two inks are a Unistyles variant, and the jest mock strips `variants`
	// from every stylesheet and stubs `useVariants` to a no-op — so the muted
	// fallback colour never reaches the rendered tree here and cannot be
	// asserted. what can still fail is the selection, which is what these two
	// cover: delete the `useVariants` call, or compute `hasTitle` from the wrong
	// thing, and they go red.
	it("selects the titled variant for a record that has a title", () => {
		const useVariants = jest.spyOn(styles, "useVariants");

		try {
			render(<CollectionRecordCard record={TITLED} slug={SLUG} />);

			expect(useVariants).toHaveBeenCalledWith({ hasTitle: true });
		} finally {
			useVariants.mockRestore();
		}
	});

	it("selects the fallback variant for a record that has none", () => {
		const useVariants = jest.spyOn(styles, "useVariants");

		try {
			render(<CollectionRecordCard record={UNTITLED} slug={SLUG} />);

			expect(useVariants).toHaveBeenCalledWith({ hasTitle: false });
		} finally {
			useVariants.mockRestore();
		}
	});

	// the metadata row's own text is shorter than the fixed line box, so the row
	// is held open explicitly; without that, the card would be shorter than the
	// skeleton standing in for it and the list would reflow when records arrive.
	it("holds the metadata row open to the fixed line box", () => {
		const { getByText } = render(
			<CollectionRecordCard record={UNTITLED} slug={SLUG} />,
		);
		const metaText = getByText("5 hours ago");

		expect(resolveStyle(metaText.props.style)).toMatchObject({
			fontFamily: "InnovatorGrotesk-Regular",
			fontSize: 13,
			lineHeight: 18,
		});
		expect(enclosingStyle(metaText, hasHeight).height).toBe(RECORD_CARD_LINE);
	});

	// the chip is a fixed-height pill sized to the same line box; its text is the
	// monospace role, so nothing in the card carries a font size of its own.
	it("draws the id chip from the code role inside a line-box-tall pill", () => {
		const { getByText } = render(
			<CollectionRecordCard record={TITLED} slug={SLUG} />,
		);
		const chipText = getByText(TITLED.id);

		expect(resolveStyle(chipText.props.style)).toMatchObject({
			fontFamily: "JetBrainsMono-Regular",
			fontSize: 14,
		});
		expect(enclosingStyle(chipText, hasHeight)).toMatchObject({
			height: RECORD_CARD_LINE,
			borderRadius: themes.light.radius.pill,
		});
	});

	// the inconsistency this card was changed for: the card whose id is the only
	// thing identifying it used to be the one card without the pill.
	it("carries the id chip on a title-less record too", () => {
		const { getByText } = render(
			<CollectionRecordCard record={UNTITLED} slug={SLUG} />,
		);
		const chipText = getByText(UNTITLED.id);

		expect(enclosingStyle(chipText, hasHeight)).toMatchObject({
			height: RECORD_CARD_LINE,
			borderRadius: themes.light.radius.pill,
		});
	});

	// the row's two ends are fixed: the pill gives way to keep the label whole,
	// never the other way round.
	it("sits the chip at the start of the row and the update label at the end", () => {
		const { getByText } = render(
			<CollectionRecordCard record={TITLED} slug={SLUG} />,
		);

		expect(
			enclosingStyle(
				getByText(TITLED.id),
				(style) => style.justifyContent === "space-between",
			),
		).toMatchObject({ flexDirection: "row", height: RECORD_CARD_LINE });
		expect(enclosingStyle(getByText(TITLED.id), hasHeight).flexShrink).toBe(1);
		expect(resolveStyle(getByText(TITLED.id).props.style).flexShrink).toBe(1);
		expect(resolveStyle(getByText("5 hours ago").props.style).flexShrink).toBe(
			0,
		);
	});

	it("renders no update label when the record has no readable updatedAt", () => {
		const { getByText, queryByText } = render(
			<CollectionRecordCard
				record={{ ...UNTITLED, updatedAt: null }}
				slug={SLUG}
			/>,
		);

		expect(queryByText("5 hours ago")).toBeNull();
		expect(enclosingStyle(getByText(UNTITLED.id), hasHeight).height).toBe(
			RECORD_CARD_LINE,
		);
		// `space-between` puts a lone child at the start, so the chip keeping the
		// left edge is a consequence of the row holding nothing else. that is what
		// this asserts — the count, which is the mechanism — since the resolved
		// position itself is a layout an off-device render never computes.
		expect(
			enclosingNode(getByText(UNTITLED.id), isMetaRow)?.children,
		).toHaveLength(1);
	});

	// the card's height is set entirely by styles — two fixed line boxes inside a
	// fixed padding — so two cards drawing the same ones are the same height. no
	// off-device render computes a height to compare, and these are the values it
	// would compute from.
	it("gives a titled and a title-less card the same geometry", () => {
		const geometry = (record: CollectionRecord, title: string) => {
			const card = render(<CollectionRecordCard record={record} slug={SLUG} />);

			return {
				card: resolveStyle(
					card.getByTestId(`collection-record-list-item-${record.id}`).props
						.style,
				),
				row: enclosingStyle(card.getByText(record.id), isMetaRow),
				titleLineHeight: resolveStyle(card.getByText(title).props.style)
					.lineHeight,
			};
		};

		expect(geometry(UNTITLED, "Untitled")).toEqual(
			geometry(TITLED, TITLED.title),
		);
	});

	it("announces a titled record by its title and a title-less one by its id", () => {
		const titled = render(<CollectionRecordCard record={TITLED} slug={SLUG} />);
		const untitled = render(
			<CollectionRecordCard record={UNTITLED} slug={SLUG} />,
		);

		expect(
			titled.getByTestId(`collection-record-list-item-${TITLED.id}`).props
				.accessibilityLabel,
		).toBe(TITLED.title);
		expect(
			untitled.getByTestId(`collection-record-list-item-${UNTITLED.id}`).props
				.accessibilityLabel,
		).toBe(UNTITLED.id);
	});

	// the reason the view model carries a timestamp instead of a label: one built
	// when the page was parsed would sit frozen in the query cache, and a feed
	// left open would go on reading as it did hours earlier.
	it("formats the label at render, so a card re-rendered later reads older", () => {
		jest.useFakeTimers();
		jest.setSystemTime(Date.UTC(2026, 7, 18, 12, 0, 0));

		const record: CollectionRecord = {
			...TITLED,
			updatedAt: Date.UTC(2026, 7, 18, 7, 0, 0),
		};
		const { getByText, rerender } = render(
			<CollectionRecordCard record={record} slug={SLUG} />,
		);

		expect(getByText("5 hours ago")).toBeTruthy();

		jest.setSystemTime(Date.UTC(2026, 7, 18, 14, 0, 0));
		rerender(<CollectionRecordCard record={record} slug={SLUG} />);

		expect(getByText("7 hours ago")).toBeTruthy();
	});
});
