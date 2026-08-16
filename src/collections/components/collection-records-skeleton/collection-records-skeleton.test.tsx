import { describe, expect, it } from "@jest/globals";
import { render } from "@testing-library/react-native";
import { CollectionRecordsSkeleton } from "./collection-records-skeleton";

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
});
