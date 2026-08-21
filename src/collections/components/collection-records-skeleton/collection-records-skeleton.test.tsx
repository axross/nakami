import { describe, expect, it } from "@jest/globals";
import { render } from "@testing-library/react-native";
import { RECORD_CARD_LINE } from "~/collections/components/collection-record-card/collection-record-card";
import { SEARCH_FIELD_HEIGHT } from "~/collections/components/collection-records-header/collection-records-search-field";
import { resolveStyle } from "~/common/test-helpers/resolve-style";
import { subtreeStyles } from "~/common/test-helpers/subtree-styles";
import { themes } from "~/unistyles";
import { CollectionRecordsSkeleton } from "./collection-records-skeleton";

type Node = { props?: { style?: unknown }; children?: readonly unknown[] };

/**
 * the *deepest* node in a rendered subtree whose own style satisfies `matches`,
 * so a placeholder carrying no test hook can be reached and its children
 * counted rather than only its style observed. deepest rather than first: a
 * composite node and the host node beneath it both hold the style prop, and
 * only the host one holds the children worth counting.
 */
function findNode(
	node: unknown,
	matches: (style: Record<string, unknown>) => boolean,
): Node | null {
	if (typeof node !== "object" || node === null) {
		return null;
	}

	const { props, children } = node as Node;

	for (const child of children ?? []) {
		const found = findNode(child, matches);

		if (found !== null) {
			return found;
		}
	}

	return props?.style !== undefined && matches(resolveStyle(props.style))
		? (node as Node)
		: null;
}

describe("<CollectionRecordsSkeleton>", () => {
	it("hooks and labels its root by default", () => {
		const { getByTestId } = render(<CollectionRecordsSkeleton />);

		expect(
			getByTestId("collection-records-loading").props.accessibilityLabel,
		).toBe("Loading records");
	});

	// a component that hard-codes its own hook cannot be used twice on one screen
	// and told apart, so the default has to be a default rather than a fixture.
	it("lets the caller override the test hook", () => {
		const { getByTestId, queryByTestId } = render(
			<CollectionRecordsSkeleton testID="second-records-loading" />,
		);

		expect(getByTestId("second-records-loading")).toBeTruthy();
		expect(queryByTestId("collection-records-loading")).toBeNull();
	});

	// the placeholder feed has to sit exactly where the loaded feed sits,
	// safe-area inset included, or the cards jump sideways when the records
	// arrive. Unistyles' jest mock reports zero insets, so this is the zero-inset
	// device: the padding has to fall back to the design gutter rather than
	// collapsing to the raw inset.
	it("keeps the loaded feed's horizontal gutter when the runtime reports no insets", () => {
		const { getByTestId } = render(<CollectionRecordsSkeleton />);
		const feed = findNode(
			getByTestId("collection-records-loading"),
			(style) => style.gap === themes.light.gap.sm,
		);

		const gutter = resolveStyle(feed?.props?.style);

		expect(gutter.paddingStart).toBe(themes.light.gap.md);
		expect(gutter.paddingEnd).toBe(themes.light.gap.md);
	});

	// the search section is drawn above the feed on the loaded screen, so the
	// placeholder carries one too — at the same fixed field height and the same
	// gutter — or the whole feed drops by the section's height the moment the
	// records arrive.
	it("stands a section placeholder in for the loaded search section", () => {
		const { getByTestId } = render(<CollectionRecordsSkeleton />);
		const styles = subtreeStyles(getByTestId("collection-records-loading"));

		expect(
			styles.some(
				(style) =>
					style.borderBottomWidth === themes.light.borderWidth.hairline &&
					style.paddingStart === themes.light.gap.md &&
					style.paddingEnd === themes.light.gap.md,
			),
		).toBe(true);
		expect(styles.some((style) => style.height === SEARCH_FIELD_HEIGHT)).toBe(
			true,
		);
	});

	// the placeholder metadata row stands in for a loaded one holding two things
	// at opposite ends — the record's id and the update label — and it has to
	// keep the loaded row's line box, or the list reflows the moment the records
	// replace it. only the row: what sits inside it is two lines of text, so its
	// bars are sized like text rather than to the row, and the test below is
	// where their own metrics are pinned.
	it("stands its metadata placeholder in for the loaded row's line box", () => {
		const { getByTestId } = render(<CollectionRecordsSkeleton />);
		const styles = subtreeStyles(getByTestId("collection-records-loading"));

		expect(
			styles.some(
				(style) =>
					style.flexDirection === "row" &&
					style.justifyContent === "space-between" &&
					style.height === RECORD_CARD_LINE,
			),
		).toBe(true);
	});

	// the id's bar alone would satisfy the row above while the label's own bar
	// went missing, so the row is also asserted to hold two things: the wider bar
	// the id stands behind, then the short one the update label does. which end
	// each sits at is a layout an off-device render never computes; the pair,
	// their order, and their widths are what it can show.
	it("puts a second, shorter bar after the id's in that row", () => {
		const { getByTestId } = render(<CollectionRecordsSkeleton />);
		const row = findNode(
			getByTestId("collection-records-loading"),
			(style) =>
				style.justifyContent === "space-between" &&
				style.height === RECORD_CARD_LINE,
		);

		const bars = (row?.children ?? []).map((child) =>
			resolveStyle((child as { props?: { style?: unknown } }).props?.style),
		);

		expect(bars).toHaveLength(2);
		expect(bars[0]).toMatchObject({
			width: "62%",
			borderRadius: themes.light.radius.sm,
		});
		expect(bars[1]?.width).toBe("20%");
		expect(bars[0]?.height).toBe(bars[1]?.height);
	});
});
