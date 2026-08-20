import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";
import { CollectionRecordsSearchField } from "./collection-records-search-field";

describe("<CollectionRecordsSearchField>", () => {
	it("names what it searches, in the placeholder and to a screen reader", () => {
		const { getByTestId } = render(
			<CollectionRecordsSearchField onChangeQuery={jest.fn()} query="" />,
		);

		const input = getByTestId("collection-records-search-input");

		expect(input.props.placeholder).toBe("Search records");
		expect(input.props.accessibilityLabel).toBe("Search records");
	});

	it("reports what is typed", () => {
		const onChangeQuery = jest.fn();
		const { getByTestId } = render(
			<CollectionRecordsSearchField onChangeQuery={onChangeQuery} query="" />,
		);

		fireEvent.changeText(
			getByTestId("collection-records-search-input"),
			"release",
		);

		expect(onChangeQuery).toHaveBeenCalledWith("release");
	});

	it("offers nothing to clear while the field is empty", () => {
		const { queryByTestId } = render(
			<CollectionRecordsSearchField onChangeQuery={jest.fn()} query="" />,
		);

		expect(queryByTestId("collection-records-search-clear")).toBeNull();
	});

	// the only way back to the whole feed from a query that matched nothing, so
	// it is a labelled button rather than a glyph a screen reader cannot name.
	it("empties the field through a labelled clear button", () => {
		const onChangeQuery = jest.fn();
		const { getByTestId } = render(
			<CollectionRecordsSearchField
				onChangeQuery={onChangeQuery}
				query="release"
			/>,
		);

		const clear = getByTestId("collection-records-search-clear");

		expect(clear.props.accessibilityLabel).toBe("Clear search");
		expect(clear.props.accessibilityRole).toBe("button");

		fireEvent.press(clear);

		expect(onChangeQuery).toHaveBeenCalledWith("");
	});

	// a component that hard-codes its own hook cannot be used twice on one screen
	// and told apart, so the default has to be a default rather than a fixture.
	it("lets the caller override the test hook", () => {
		const { getByTestId, queryByTestId } = render(
			<CollectionRecordsSearchField
				onChangeQuery={jest.fn()}
				query=""
				testID="second-search"
			/>,
		);

		expect(getByTestId("second-search-input")).toBeTruthy();
		expect(queryByTestId("collection-records-search-input")).toBeNull();
	});
});
