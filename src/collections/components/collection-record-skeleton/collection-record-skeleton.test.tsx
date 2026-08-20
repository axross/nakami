import { describe, expect, it, jest } from "@jest/globals";
import { render } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import { themes } from "~/unistyles";
import { CollectionRecordSkeleton } from "./collection-record-skeleton";

// the skeleton pulls in react-native-reanimated (v4 → react-native-worklets),
// whose real module throws on import under jest. redirect it to the project's
// manual mock, as the record feed's skeleton suite does.
jest.mock("react-native-reanimated", () =>
	require("react-native-reanimated/mock"),
);

describe("<CollectionRecordSkeleton>", () => {
	it("announces what is loading rather than presenting as content", () => {
		const { getByTestId } = render(<CollectionRecordSkeleton />);
		const root = getByTestId("collection-record-loading");

		expect(root.props.accessible).toBe(true);
		expect(root.props.accessibilityLabel).toBe("Loading record");
	});

	// the placeholder stands in for the loaded field list, so it has to sit where
	// that list will: a mismatched gutter makes the fields jump sideways the
	// moment the record arrives. Unistyles' jest mock reports zero insets, so
	// this is the zero-inset device and the padding has to fall back to the
	// design gutter rather than collapsing to the raw inset.
	it("mirrors the loaded field list's own gutter and rhythm", () => {
		const { getByTestId } = render(<CollectionRecordSkeleton />);

		const fields = StyleSheet.flatten(
			getByTestId("collection-record-loading").props.style,
		);

		expect(fields.paddingStart).toBe(themes.light.gap.md);
		expect(fields.paddingEnd).toBe(themes.light.gap.md);
		expect(fields.rowGap).toBe(themes.light.gap.lg);
	});

	it("takes a style from its caller, which wins over its own", () => {
		const { getByTestId } = render(
			<CollectionRecordSkeleton style={{ paddingTop: 99 }} />,
		);

		expect(
			StyleSheet.flatten(getByTestId("collection-record-loading").props.style)
				.paddingTop,
		).toBe(99);
	});
});
