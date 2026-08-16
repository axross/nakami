import { describe, expect, it } from "@jest/globals";
import { render } from "@testing-library/react-native";
import { themes } from "~/unistyles";
import { CollectionRecordsSkeleton } from "./collection-records-skeleton";

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

describe("<CollectionRecordsSkeleton>", () => {
	it("hooks and labels its root by default", () => {
		const { getByTestId } = render(<CollectionRecordsSkeleton />);

		expect(
			getByTestId("collection-records-loading").props.accessibilityLabel,
		).toBe("Loading records");
	});

	// A component that hard-codes its own hook cannot be used twice on one screen
	// and told apart, so the default has to be a default rather than a fixture.
	it("lets the caller override the test hook", () => {
		const { getByTestId, queryByTestId } = render(
			<CollectionRecordsSkeleton testID="second-records-loading" />,
		);

		expect(getByTestId("second-records-loading")).toBeTruthy();
		expect(queryByTestId("collection-records-loading")).toBeNull();
	});

	// The placeholder feed has to sit exactly where the loaded feed sits,
	// safe-area inset included, or the cards jump sideways when the records
	// arrive. Unistyles' jest mock reports zero insets, so this is the zero-inset
	// device: the padding has to fall back to the design gutter rather than
	// collapsing to the raw inset.
	it("keeps the loaded feed's horizontal gutter when the runtime reports no insets", () => {
		const { getByTestId } = render(<CollectionRecordsSkeleton />);

		const feed = resolveStyle(
			getByTestId("collection-records-loading").props.style,
		);

		expect(feed.paddingStart).toBe(themes.light.gap.md);
		expect(feed.paddingEnd).toBe(themes.light.gap.md);
	});
});
