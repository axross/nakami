import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	jest,
} from "@jest/globals";
import { QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import type { Session } from "~/auth/models/session";
import { useAuthStore } from "~/auth/stores/auth-store";
import { fetchRecords } from "~/collections/helpers/fetch-records";
import type { RecordPageResponse } from "~/collections/models/record";
import { PayloadRequestError } from "~/common/helpers/payload-client";
import { createTestQueryClient } from "~/common/helpers/test-query-client";
import { themes } from "~/unistyles";
import { CollectionRecordsScreen } from "./collection-records-screen";

// The loading skeleton pulls in react-native-reanimated (v4 → react-native-
// worklets), whose real module throws on import under jest. Redirect it to the
// project's manual mock — the same substitution expo-router's testing-library
// makes for suites that render through it.
jest.mock("react-native-reanimated", () =>
	require("react-native-reanimated/mock"),
);

// Mock the data layer; the query, its factory, and the record mapping run for
// real, so pagination and error mapping are exercised end to end.
jest.mock("~/collections/helpers/fetch-records", () => ({
	fetchRecords: jest.fn(),
}));

const SESSION: Session = {
	serverUrl: "https://cms.example.com",
	collectionSlug: "users",
	token: "jwt-token",
	exp: 9_999_999_999,
	user: { id: "user-1", email: "you@example.com" },
};

function page(overrides: Partial<RecordPageResponse>): RecordPageResponse {
	return {
		docs: [],
		totalDocs: 0,
		hasNextPage: false,
		nextPage: null,
		...overrides,
	};
}

function renderScreen() {
	const client = createTestQueryClient();
	return render(
		<QueryClientProvider client={client}>
			<CollectionRecordsScreen slug="posts" />
		</QueryClientProvider>,
	);
}

beforeEach(() => {
	jest.clearAllMocks();
	useAuthStore.setState({ status: "authenticated", session: SESSION });
});

afterEach(() => {
	useAuthStore.setState({ status: "unauthenticated", session: null });
});

describe("<CollectionRecordsScreen>", () => {
	it("shows the loading skeleton while the first page is pending", async () => {
		jest
			.mocked(fetchRecords)
			.mockReturnValue(new Promise<RecordPageResponse>(() => {}));

		const { getByTestId } = renderScreen();

		await waitFor(() => {
			expect(getByTestId("collection-records-loading")).toBeTruthy();
		});
		expect(getByTestId("collection-records-screen")).toBeTruthy();
	});

	it("shows an error state with a retry that refetches", async () => {
		jest
			.mocked(fetchRecords)
			.mockRejectedValue(new PayloadRequestError("network", "unreachable"));

		const { getByTestId, getByText } = renderScreen();

		await waitFor(() => {
			expect(getByTestId("collection-records-error")).toBeTruthy();
		});
		expect(getByText("Couldn't load")).toBeTruthy();

		fireEvent.press(getByTestId("collection-records-retry-button"));
		await waitFor(() => {
			expect(fetchRecords).toHaveBeenCalledTimes(2);
		});
	});

	it("shows a permission message with no retry on an auth failure", async () => {
		jest
			.mocked(fetchRecords)
			.mockRejectedValue(new PayloadRequestError("auth", "rejected", 403));

		const { getByTestId, getByText, queryByTestId } = renderScreen();

		await waitFor(() => {
			expect(getByText("Can't access records")).toBeTruthy();
		});
		expect(getByTestId("collection-records-error")).toBeTruthy();
		expect(queryByTestId("collection-records-retry-button")).toBeNull();
	});

	it("shows the empty state when the collection has no records", async () => {
		jest.mocked(fetchRecords).mockResolvedValue(page({}));

		const { getByTestId, getByText } = renderScreen();

		await waitFor(() => {
			expect(getByTestId("collection-records-empty")).toBeTruthy();
		});
		expect(getByText("No records")).toBeTruthy();
	});

	it("lists the records with a derived title and the total count", async () => {
		jest.mocked(fetchRecords).mockResolvedValue(
			page({
				docs: [
					{ id: "r1", title: "A field guide" },
					{ id: "r2", name: "By name" },
				],
				totalDocs: 2,
			}),
		);

		const { getByTestId, getByText } = renderScreen();

		await waitFor(() => {
			expect(getByTestId("collection-record-list-item-r1")).toBeTruthy();
		});
		expect(getByText("A field guide")).toBeTruthy();
		expect(getByText("By name")).toBeTruthy();
		expect(getByText("2 records")).toBeTruthy();
	});

	it("appends the next page when the list reaches its end", async () => {
		jest
			.mocked(fetchRecords)
			.mockResolvedValueOnce(
				page({
					docs: [{ id: "r1", title: "Page one" }],
					totalDocs: 2,
					hasNextPage: true,
					nextPage: 2,
				}),
			)
			.mockResolvedValueOnce(
				page({ docs: [{ id: "r2", title: "Page two" }], totalDocs: 2 }),
			);

		const { getByTestId, getByText } = renderScreen();

		await waitFor(() => {
			expect(getByText("Page one")).toBeTruthy();
		});

		// Seed the virtualized list's layout/content metrics (no real layout runs
		// in the test renderer) so scrolling to the bottom computes a distance and
		// fires onEndReached.
		const list = getByTestId("collection-records-list");
		fireEvent(list, "layout", {
			nativeEvent: { layout: { x: 0, y: 0, width: 400, height: 500 } },
		});
		fireEvent(list, "contentSizeChange", 400, 1000);
		fireEvent.scroll(list, {
			nativeEvent: {
				contentOffset: { y: 600 },
				contentSize: { height: 1000, width: 400 },
				layoutMeasurement: { height: 500, width: 400 },
			},
		});

		await waitFor(() => {
			expect(getByText("Page two")).toBeTruthy();
		});
		expect(fetchRecords).toHaveBeenCalledTimes(2);
		expect(fetchRecords).toHaveBeenLastCalledWith(
			"https://cms.example.com",
			"jwt-token",
			"posts",
			2,
		);
	});

	// A stack header and the tab bar clear this screen's vertical edges, so it
	// owns only the horizontal pair — carried on the feed's content container so
	// cards scroll under the chrome. Unistyles' jest mock reports zero insets, so
	// this is the zero-inset device: the feed's padding has to fall back to the
	// design gutter rather than collapsing to the raw inset.
	it("keeps the feed's horizontal gutter when the runtime reports no insets", async () => {
		jest
			.mocked(fetchRecords)
			.mockResolvedValue(
				page({ docs: [{ id: "r1", title: "A field guide" }], totalDocs: 1 }),
			);

		const { getByTestId } = renderScreen();

		await waitFor(() => {
			expect(getByTestId("collection-record-list-item-r1")).toBeTruthy();
		});

		const list = StyleSheet.flatten(
			getByTestId("collection-records-list").props.contentContainerStyle,
		);

		expect(list.paddingStart).toBe(themes.light.gap.md);
		expect(list.paddingEnd).toBe(themes.light.gap.md);
	});
});
