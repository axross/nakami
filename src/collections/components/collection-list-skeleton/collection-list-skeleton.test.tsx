import { describe, expect, it } from "@jest/globals";
import { render } from "@testing-library/react-native";
import { themes } from "~/unistyles";
import { CollectionListSkeleton } from "./collection-list-skeleton";

/**
 * flattens whatever React Native accepts as a `style` prop (an object, or an
 * arbitrarily nested array of them) into the single resolved object the
 * renderer would apply.
 */
function resolveStyle(style: unknown): Record<string, unknown> {
	if (Array.isArray(style)) {
		return Object.assign({}, ...style.map(resolveStyle));
	}

	return typeof style === "object" && style !== null
		? (style as Record<string, unknown>)
		: {};
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
	// collections screen passes the fill in through `style`.
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

	// the placeholder card has to sit exactly where the loaded list's card sits,
	// safe-area inset included, or the list jumps sideways when the collections
	// arrive. Unistyles' jest mock reports zero insets, so this is the zero-inset
	// device: the margin has to fall back to the design gutter rather than
	// collapsing to the raw inset.
	//
	// read from the card rather than the root, which carries no inset of its own.
	it("keeps the loaded card's horizontal gutter when the runtime reports no insets", () => {
		const { getByTestId } = render(<CollectionListSkeleton />);

		const card = resolveStyle(
			getByTestId("collections-loading-card").props.style,
		);

		expect(card.marginStart).toBe(themes.light.gap.md);
		expect(card.marginEnd).toBe(themes.light.gap.md);
	});
});
