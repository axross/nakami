import { describe, expect, it, jest } from "@jest/globals";
import { render } from "@testing-library/react-native";
import { CollectionRecordsSkeleton } from "./collection-records-skeleton";

// Rendering the skeleton outside a route pulls in reanimated directly, which
// needs its native module. The screen tests get the substitute for free from
// expo-router's testing library; here it is wired by hand, to the same manual
// mock jest.config.cjs maps the package's broken `/mock` entry to.
jest.mock("react-native-reanimated", () =>
	require("react-native-reanimated/mock"),
);

describe("<CollectionRecordsSkeleton>", () => {
	it("labels its root with the default test hook", () => {
		const { getByTestId } = render(<CollectionRecordsSkeleton />);

		expect(getByTestId("collection-records-loading")).toBeTruthy();
	});

	it("lets a caller name its own test hook", () => {
		const { getByTestId, queryByTestId } = render(
			<CollectionRecordsSkeleton testID="secondary-records-loading" />,
		);

		expect(getByTestId("secondary-records-loading")).toBeTruthy();
		expect(queryByTestId("collection-records-loading")).toBeNull();
	});
});
