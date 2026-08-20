import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react-native";
import { resolveStyle } from "~/common/test-helpers/resolve-style";
import { themes } from "~/unistyles";
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

	// this section spans the screen rather than sitting inside the feed's gutter,
	// so the horizontal safe-area inset is its own rather than the cards'.
	// Unistyles' jest mock resolves every stylesheet with zero insets, so this
	// assertion stands in for a device reporting none: the gutter the cards below
	// already use has to survive, rather than the edge collapsing to the raw
	// inset and putting the field hard against the screen.
	it("keeps the feed's own gutter when the runtime reports no insets", () => {
		const { getByTestId } = render(
			<CollectionRecordsHeader
				count={{ kind: "all", total: 128 }}
				onChangeQuery={jest.fn()}
				query=""
			/>,
		);

		const section = resolveStyle(
			getByTestId("collection-records-header").props.style,
		);

		expect(section.paddingStart).toBe(themes.light.gap.md);
		expect(section.paddingEnd).toBe(themes.light.gap.md);
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
