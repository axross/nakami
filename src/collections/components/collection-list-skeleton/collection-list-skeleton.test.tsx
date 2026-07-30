import { describe, expect, it, jest } from "@jest/globals";
import { render } from "@testing-library/react-native";
import { CollectionListSkeleton } from "./collection-list-skeleton";

// Rendering the skeleton outside a route pulls in reanimated directly, which
// needs its native module. The screen tests get the substitute for free from
// expo-router's testing library; here it is wired by hand, to the same manual
// mock jest.config.cjs maps the package's broken `/mock` entry to.
jest.mock("react-native-reanimated", () =>
	require("react-native-reanimated/mock"),
);

describe("<CollectionListSkeleton>", () => {
	it("labels its root with the default test hook", () => {
		const { getByTestId } = render(<CollectionListSkeleton />);

		expect(getByTestId("collections-loading")).toBeTruthy();
	});

	it("lets a caller name its own test hook", () => {
		const { getByTestId, queryByTestId } = render(
			<CollectionListSkeleton testID="secondary-collections-loading" />,
		);

		expect(getByTestId("secondary-collections-loading")).toBeTruthy();
		expect(queryByTestId("collections-loading")).toBeNull();
	});
});
