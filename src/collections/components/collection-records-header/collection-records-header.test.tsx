import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";
import { CollectionRecordsHeader } from "./collection-records-header";

// the section animates its own height, which pulls in react-native-reanimated
// (v4 → react-native-worklets), whose real module throws on import under jest.
// redirect it to the project's manual mock — the same substitution
// expo-router's testing-library makes for suites that render through it.
jest.mock("react-native-reanimated", () =>
	require("react-native-reanimated/mock"),
);

describe("<CollectionRecordsHeader>", () => {
	it("reports the collection's own size beside the field", () => {
		const { getByTestId } = render(
			<CollectionRecordsHeader
				count={{ kind: "all", total: 128 }}
				onChangeQuery={jest.fn()}
				query=""
			/>,
		);

		expect(getByTestId("collection-records-header-count").props.children).toBe(
			"128 records",
		);
	});

	it("reports how much of the collection a search matched", () => {
		const { getByTestId } = render(
			<CollectionRecordsHeader
				count={{ kind: "matches", total: 3 }}
				onChangeQuery={jest.fn()}
				query="release"
			/>,
		);

		expect(getByTestId("collection-records-header-count").props.children).toBe(
			"3 matching records",
		);
	});

	// a search that failed has no count to report, and the failure below the
	// section is what a reader needs from that line's place instead.
	it("draws no count line when there is no count to give", () => {
		const { queryByTestId } = render(
			<CollectionRecordsHeader onChangeQuery={jest.fn()} query="release" />,
		);

		expect(queryByTestId("collection-records-header-count")).toBeNull();
	});

	// shrinking is the section giving room back, never taking the field away:
	// a collapsed header a reader cannot type into would defeat fixing it under
	// the screen header at all.
	it("keeps the field usable while collapsed", () => {
		const onChangeQuery = jest.fn();
		const { getByTestId } = render(
			<CollectionRecordsHeader
				collapsed
				count={{ kind: "all", total: 128 }}
				onChangeQuery={onChangeQuery}
				query=""
			/>,
		);

		fireEvent.changeText(
			getByTestId("collection-records-search-input"),
			"release",
		);

		expect(onChangeQuery).toHaveBeenCalledWith("release");
	});

	it("passes the query through to the field", () => {
		const { getByTestId } = render(
			<CollectionRecordsHeader
				count={{ kind: "searching" }}
				onChangeQuery={jest.fn()}
				query="release"
			/>,
		);

		expect(getByTestId("collection-records-search-input").props.value).toBe(
			"release",
		);
		expect(getByTestId("collection-records-header-count").props.children).toBe(
			"Searching…",
		);
	});
});
