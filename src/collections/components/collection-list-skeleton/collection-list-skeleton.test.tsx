import { describe, expect, it } from "@jest/globals";
import { render } from "@testing-library/react-native";
import { CollectionListSkeleton } from "./collection-list-skeleton";

/**
 * Flattens whatever React Native accepts as a `style` prop (an object, or an
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
	// The hook and the accessible label now sit on the root rather than on the
	// inner card, so a caller-supplied label cannot produce a second labelled
	// node beside the component's own.
	it("hooks and labels its root by default", () => {
		const { getByTestId } = render(<CollectionListSkeleton />);

		expect(getByTestId("collections-loading").props.accessibilityLabel).toBe(
			"Loading collections",
		);
	});

	// A component that hard-codes its own hook cannot be used twice on one screen
	// and told apart, so the default has to be a default rather than a fixture.
	it("lets the caller override the test hook", () => {
		const { getByTestId, queryByTestId } = render(
			<CollectionListSkeleton testID="second-collections-loading" />,
		);

		expect(getByTestId("second-collections-loading")).toBeTruthy();
		expect(queryByTestId("collections-loading")).toBeNull();
	});

	// How much room the skeleton gets is the consumer's half of the split; the
	// Collections screen passes the fill in through `style`.
	it("claims no fill of its own", () => {
		const { getByTestId } = render(<CollectionListSkeleton />);
		const resolved = resolveStyle(
			getByTestId("collections-loading").props.style,
		);

		// Anchored on a property the root does set, so a `resolveStyle` that ever
		// resolved to nothing would fail here rather than satisfy the assertion
		// below by returning an empty object.
		expect(resolved).toHaveProperty("backgroundColor");
		expect(resolved).not.toHaveProperty("flex");
	});
});
