import { describe, expect, it } from "@jest/globals";
import { render } from "@testing-library/react-native";
import { RECORD_CARD_LINE } from "~/collections/components/collection-record-card/collection-record-card";
import { resolveStyle } from "~/common/test-helpers/resolve-style";
import { themes } from "~/unistyles";
import { CollectionRecordsSkeleton } from "./collection-records-skeleton";

/**
 * every style in a rendered subtree, flattened, so a placeholder that carries
 * no test hook of its own can still be asserted on by its shape. an element
 * appears more than once (a composite node and the host node under it both hold
 * the style prop), so this answers "is there one like this" rather than "how
 * many".
 */
function subtreeStyles(node: unknown): Record<string, unknown>[] {
	if (typeof node !== "object" || node === null) {
		return [];
	}

	const { props, children } = node as {
		props?: { style?: unknown };
		children?: readonly unknown[];
	};

	return [
		...(props?.style === undefined ? [] : [resolveStyle(props.style)]),
		...(children ?? []).flatMap(subtreeStyles),
	];
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

		const feed = resolveStyle(
			getByTestId("collection-records-loading").props.style,
		);

		expect(feed.paddingStart).toBe(themes.light.gap.md);
		expect(feed.paddingEnd).toBe(themes.light.gap.md);
	});

	// the placeholder metadata row stands in for a loaded one holding two things
	// at opposite ends — the id pill and the update label — and both it and the
	// pill inside it have to keep the loaded row's line box, or the list reflows
	// the moment the records replace it.
	it("stands its metadata placeholder in for the loaded row's pill and label", () => {
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
		expect(
			styles.some(
				(style) =>
					style.borderRadius === themes.light.radius.pill &&
					style.height === RECORD_CARD_LINE,
			),
		).toBe(true);
	});
});
