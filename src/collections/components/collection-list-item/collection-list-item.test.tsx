import { describe, expect, it } from "@jest/globals";
import { renderRouter } from "expo-router/testing-library";
import type { JSX } from "react";
import { CollectionRecordCard } from "~/collections/components/collection-record-card/collection-record-card";
import type { Collection } from "~/collections/models/collection";
import type { CollectionRecord } from "~/collections/models/record";
import { resolveStyle } from "~/common/test-helpers/resolve-style";
import { CollectionListItem } from "./collection-list-item";

const COLLECTION: Collection = { slug: "blog-posts", label: "Blog posts" };

const RECORD: CollectionRecord = {
	id: "6712a9f4c1b2e3d4",
	title: "Getting started with Payload",
	hasTitle: true,
	updatedAt: null,
};

// the surface a card is, as opposed to the layout of what sits inside it. the
// two components lay their contents out differently on purpose — one line of
// row here, two stacked line boxes there — and it is only this set they have to
// agree on for the two screens to read as one.
const CARD_SURFACE = [
	"backgroundColor",
	"borderColor",
	"borderWidth",
	"borderRadius",
	"paddingVertical",
	"paddingHorizontal",
] as const;

function surfaceOf(style: unknown): Record<string, unknown> {
	const resolved = resolveStyle(style);

	return Object.fromEntries(
		CARD_SURFACE.map((property) => [property, resolved[property]]),
	);
}

/**
 * mounts the card under a route tree, because its `Link` needs a router in
 * context. the card is the whole of the route body, so nothing but the
 * components under test are rendered.
 */
function renderItem(element: JSX.Element) {
	return renderRouter(
		{ "collections/index": () => element },
		{ initialUrl: "/collections" },
	);
}

describe("<CollectionListItem>", () => {
	// the inconsistency this component was reshaped for: the Collections tab and
	// the record feed one tap deeper drew the same kind of list two different
	// ways. asserted against the record card's own resolved surface rather than
	// against literals, so a change to either one that leaves the other behind
	// is what goes red — which is the whole of what "consistent" means here.
	it("draws itself as the surface the record feed's card draws", () => {
		const { getByTestId } = renderItem(
			<>
				<CollectionListItem collection={COLLECTION} />
				<CollectionRecordCard record={RECORD} slug={COLLECTION.slug} />
			</>,
		);

		expect(
			surfaceOf(
				getByTestId(`collection-list-item-${COLLECTION.slug}`).props.style,
			),
		).toEqual(
			surfaceOf(
				getByTestId(`collection-record-list-item-${RECORD.id}`).props.style,
			),
		);
	});

	// a card with nothing but a border is a card with no fill, and the assertion
	// above would hold on two of them. this is the anchor that keeps it honest.
	it("resolves a card surface rather than nothing at all", () => {
		const { getByTestId } = renderItem(
			<CollectionListItem collection={COLLECTION} />,
		);
		const surface = surfaceOf(
			getByTestId(`collection-list-item-${COLLECTION.slug}`).props.style,
		);

		expect(surface.backgroundColor).toEqual(expect.any(String));
		expect(surface.borderRadius).toEqual(expect.any(Number));
		expect(surface.borderWidth).toEqual(expect.any(Number));
	});

	// the literal root is `Link asChild`, which renders no node of its own — so
	// the rest object has to reach the `Pressable` the card renders instead. a
	// spread landing on the `Link` would type-check and silently vanish.
	it("forwards an undeclared prop to the pressable card it renders", () => {
		const { getByTestId } = renderItem(
			<CollectionListItem
				accessibilityHint="Opens this collection's records"
				collection={COLLECTION}
			/>,
		);

		expect(
			getByTestId("collection-list-item-blog-posts").props.accessibilityHint,
		).toBe("Opens this collection's records");
	});

	// the card's own hook is set before the spread, so a caller placing two cards
	// for one collection can still tell them apart.
	it("lets the caller override the card's test hook", () => {
		const { getByTestId, queryByTestId } = renderItem(
			<CollectionListItem collection={COLLECTION} testID="pinned-collection" />,
		);

		expect(getByTestId("pinned-collection")).toBeTruthy();
		expect(queryByTestId("collection-list-item-blog-posts")).toBeNull();
	});
});
