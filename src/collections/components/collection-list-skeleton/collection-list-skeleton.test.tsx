import { describe, expect, it, jest } from "@jest/globals";
import { render } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import { themes } from "~/unistyles";
import { CollectionListSkeleton } from "./collection-list-skeleton";

// The skeleton pulls in react-native-reanimated (v4 → react-native-worklets),
// whose real module throws on import under jest. Redirect it to the project's
// manual mock — the same substitution the records-screen suite makes.
jest.mock("react-native-reanimated", () =>
	require("react-native-reanimated/mock"),
);

describe("<CollectionListSkeleton>", () => {
	// The placeholder card has to sit exactly where the loaded list's card sits,
	// safe-area inset included, or the list jumps sideways when the collections
	// arrive. Unistyles' jest mock reports zero insets, so this is the zero-inset
	// device: the margin has to fall back to the design gutter rather than
	// collapsing to the raw inset.
	it("keeps the loaded card's horizontal gutter when the runtime reports no insets", () => {
		const { getByTestId } = render(<CollectionListSkeleton />);

		const card = StyleSheet.flatten(
			getByTestId("collections-loading").props.style,
		);

		expect(card.marginStart).toBe(themes.light.gap.md);
		expect(card.marginEnd).toBe(themes.light.gap.md);
	});
});
