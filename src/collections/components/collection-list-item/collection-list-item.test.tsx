import { describe, expect, it } from "@jest/globals";
import { renderRouter } from "expo-router/testing-library";
import type { JSX } from "react";
import type { Collection } from "~/collections/models/collection";
import { CollectionListItem } from "./collection-list-item";

const COLLECTION: Collection = { slug: "blog-posts", label: "Blog posts" };

/**
 * Mounts the row under a route tree, because its `Link` needs a router in
 * context. The row is the whole of the route body, so nothing but the component
 * under test is rendered.
 */
function renderItem(element: JSX.Element) {
	return renderRouter(
		{ "collections/index": () => element },
		{ initialUrl: "/collections" },
	);
}

describe("<CollectionListItem>", () => {
	// The literal root is `Link asChild`, which renders no node of its own — so
	// the rest object has to reach the `Pressable` the row renders instead. A
	// spread landing on the `Link` would type-check and silently vanish.
	it("forwards an undeclared prop to the pressable row it renders", () => {
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

	// The row's own hook is set before the spread, so a caller placing two rows
	// for one collection can still tell them apart.
	it("lets the caller override the row's test hook", () => {
		const { getByTestId, queryByTestId } = renderItem(
			<CollectionListItem collection={COLLECTION} testID="pinned-collection" />,
		);

		expect(getByTestId("pinned-collection")).toBeTruthy();
		expect(queryByTestId("collection-list-item-blog-posts")).toBeNull();
	});
});
