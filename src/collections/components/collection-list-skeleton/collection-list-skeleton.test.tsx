import { describe, expect, it } from "@jest/globals";
import { render } from "@testing-library/react-native";
import { renderRouter } from "expo-router/testing-library";
import { CollectionListItem } from "~/collections/components/collection-list-item/collection-list-item";
import { resolveStyle } from "~/common/test-helpers/resolve-style";
import { themes } from "~/unistyles";
import { CollectionListSkeleton } from "./collection-list-skeleton";

// the properties a placeholder card and a loaded one both have to resolve. read
// as a set rather than one at a time: the point is that the two shapes agree,
// and an assertion per property would pass while the card drifted on the one
// nobody thought to add.
const CARD_GEOMETRY = [
	"flexDirection",
	"alignItems",
	"columnGap",
	"minHeight",
	"paddingVertical",
	"paddingHorizontal",
	"borderWidth",
	"borderRadius",
] as const;

function geometryOf(style: unknown): Record<string, unknown> {
	const resolved = resolveStyle(style);

	return Object.fromEntries(
		CARD_GEOMETRY.map((property) => [property, resolved[property]]),
	);
}

describe("<CollectionListSkeleton>", () => {
	// the hook and the accessible label now sit on the root rather than on the
	// inner card, so a caller-supplied label cannot produce a second labelled
	// node beside the component's own.
	it("hooks and labels its root by default", () => {
		const { getByTestId } = render(<CollectionListSkeleton />);

		expect(getByTestId("collections-loading").props.accessibilityLabel).toBe(
			"Loading collections",
		);
	});

	// a component that hard-codes its own hook cannot be used twice on one screen
	// and told apart, so the default has to be a default rather than a fixture.
	it("lets the caller override the test hook", () => {
		const { getByTestId, queryByTestId } = render(
			<CollectionListSkeleton testID="second-collections-loading" />,
		);

		expect(getByTestId("second-collections-loading")).toBeTruthy();
		expect(queryByTestId("collections-loading")).toBeNull();
	});

	// how much room the skeleton gets is the consumer's half of the split; the
	// Collections screen passes the fill in through `style`.
	it("claims no fill of its own", () => {
		const { getByTestId } = render(<CollectionListSkeleton />);
		const resolved = resolveStyle(
			getByTestId("collections-loading").props.style,
		);

		// anchored on a property the root does set, so a `resolveStyle` that ever
		// resolved to nothing would fail here rather than satisfy the assertion
		// below by returning an empty object.
		expect(resolved).toHaveProperty("backgroundColor");
		expect(resolved).not.toHaveProperty("flex");
	});

	// the placeholder feed has to sit exactly where the loaded feed sits,
	// safe-area inset included, or the list jumps sideways when the collections
	// arrive. Unistyles' jest mock reports zero insets, so this is the zero-inset
	// device: the padding has to fall back to the design gutter rather than
	// collapsing to the raw inset.
	//
	// read from the root, which is the feed itself now that each placeholder
	// carries its own card.
	it("keeps the loaded feed's horizontal gutter when the runtime reports no insets", () => {
		const { getByTestId } = render(<CollectionListSkeleton />);

		const feed = resolveStyle(getByTestId("collections-loading").props.style);

		expect(feed.paddingStart).toBe(themes.light.gap.md);
		expect(feed.paddingEnd).toBe(themes.light.gap.md);
	});

	// the loaded list's own gap, so the placeholders stand as far apart as the
	// cards replacing them.
	it("spaces its placeholders by the loaded feed's gap", () => {
		const { getByTestId } = render(<CollectionListSkeleton />);

		expect(
			resolveStyle(getByTestId("collections-loading").props.style).gap,
		).toBe(themes.light.gap.sm);
	});

	// the whole reason this component mirrors the loaded item rather than
	// approximating it: a placeholder of a different height reflows the list the
	// moment the collections arrive. no off-device render computes a height, so
	// the two are compared on the values one would be computed from.
	it("draws a placeholder to the loaded card's geometry", () => {
		const skeleton = render(<CollectionListSkeleton />);
		const loaded = renderRouter(
			{
				"collections/index": () => (
					<CollectionListItem
						collection={{ slug: "blog-posts", label: "Blog posts" }}
					/>
				),
			},
			{ initialUrl: "/collections" },
		);

		expect(
			geometryOf(
				skeleton.getAllByTestId("collections-loading-card")[0]?.props.style,
			),
		).toEqual(
			geometryOf(
				loaded.getByTestId("collection-list-item-blog-posts").props.style,
			),
		);
	});
});
