import { describe, expect, it, jest } from "@jest/globals";
import { render } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import { themes } from "~/unistyles";
import { CollectionRecordsSkeleton } from "./collection-records-skeleton";

// The skeleton pulls in react-native-reanimated (v4 → react-native-worklets),
// whose real module throws on import under jest. Redirect it to the project's
// manual mock — the same substitution the records-screen suite makes.
jest.mock("react-native-reanimated", () =>
	require("react-native-reanimated/mock"),
);

describe("<CollectionRecordsSkeleton>", () => {
	// The placeholder feed has to sit exactly where the loaded feed sits,
	// safe-area inset included, or the cards jump sideways when the records
	// arrive. Unistyles' jest mock reports zero insets, so this is the zero-inset
	// device: the padding has to fall back to the design gutter rather than
	// collapsing to the raw inset.
	it("keeps the loaded feed's horizontal gutter when the runtime reports no insets", () => {
		const { getByTestId } = render(<CollectionRecordsSkeleton />);

		const feed = StyleSheet.flatten(
			getByTestId("collection-records-loading").props.style,
		);

		expect(feed.paddingStart).toBe(themes.light.gap.md);
		expect(feed.paddingEnd).toBe(themes.light.gap.md);
	});
});
