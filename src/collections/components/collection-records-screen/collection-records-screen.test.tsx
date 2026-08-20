import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	jest,
} from "@jest/globals";

import type { QueryClient } from "@tanstack/react-query";
import { onlineManager, QueryClientProvider } from "@tanstack/react-query";
import {
	act,
	cleanup,
	fireEvent,
	render,
	waitFor,
} from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import type { Session } from "~/auth/models/session";
import { useAuthStore } from "~/auth/stores/auth-store";
import { fetchRecords } from "~/collections/helpers/fetch-records";
import { findRecordById } from "~/collections/helpers/find-record-by-id";
import type { RecordPageResponse } from "~/collections/models/record";
import { PayloadRequestError } from "~/common/helpers/payload-client";
import { createTestQueryClient } from "~/common/test-helpers/query-client";
import { themes } from "~/unistyles";
import { CollectionRecordsScreen } from "./collection-records-screen";

// the loading skeleton pulls in react-native-reanimated (v4 → react-native-
// worklets), whose real module throws on import under jest. redirect it to the
// project's manual mock — the same substitution expo-router's testing-library
// makes for suites that render through it.
jest.mock("react-native-reanimated", () =>
	require("react-native-reanimated/mock"),
);

// mock the data layer; the query, its factory, and the record mapping run for
// real, so pagination and error mapping are exercised end to end.
jest.mock("~/collections/helpers/fetch-records", () => ({
	fetchRecords: jest.fn(),
}));

// the id lookup runs beside every search; mocked so a suite that never types an
// id does not reach for the network to be told so.
jest.mock("~/collections/helpers/find-record-by-id", () => ({
	findRecordById: jest.fn(),
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

let activeClient: QueryClient | null = null;

/**
 * renders the screen under a fresh, isolated QueryClient, exposing that client
 * so a test can drive the cache — invalidating a loaded feed is what reaches the
 * "paused with records already on screen" state.
 */
function renderScreen() {
	const client = createTestQueryClient();
	activeClient = client;

	return Object.assign(
		render(
			<QueryClientProvider client={client}>
				<CollectionRecordsScreen slug="posts" />
			</QueryClientProvider>,
		),
		{ client },
	);
}

/**
 * answers the unfiltered feed with `all` and every search with `matched`, so a
 * test states what each of the two queries returns rather than counting calls.
 */
function respondWith(all: RecordPageResponse, matched: RecordPageResponse) {
	jest
		.mocked(fetchRecords)
		.mockImplementation(async (_serverUrl, _token, _slug, _page, search) =>
			search === undefined ? all : matched,
		);
}

/**
 * types into the search field and waits out the screen's own debounce.
 *
 * the wait is a real one inside `act`, comfortably past the 300ms the screen
 * settles on, rather than a `waitFor` poll: the settled query arrives from a
 * bare `setTimeout`, and React holds an update from outside `act` until the
 * surrounding one exits — which a `waitFor` whose checks run *inside* that act
 * never sees.
 */
async function search(screen: ReturnType<typeof renderScreen>, query: string) {
	fireEvent.changeText(
		screen.getByTestId("collection-records-search-input"),
		query,
	);

	await act(async () => {
		await new Promise((resolve) => setTimeout(resolve, 400));
	});
}

beforeEach(() => {
	jest.clearAllMocks();
	jest.mocked(findRecordById).mockResolvedValue(null);
	useAuthStore.setState({ status: "authenticated", session: SESSION });
});

afterEach(() => {
	// order matters for the offline tests. unmount first: coming back online
	// resumes a paused query, and a resumed query under a still-mounted tree
	// lands its state update outside `act`. then empty the cache, so a paused
	// fetch is cancelled rather than resumed — `Query.onOnline` continues its
	// retryer, which would call the mocked data layer again after the test that
	// asserted on its call count. `onlineManager` is process-wide, so it is
	// restored last, or every suite after this one would run offline.
	cleanup();
	activeClient?.clear();
	activeClient = null;
	onlineManager.setOnline(true);
	useAuthStore.setState({ status: "unauthenticated", session: null });
});

describe("<CollectionRecordsScreen>", () => {
	it("shows the loading skeleton while the first page is pending", async () => {
		jest
			.mocked(fetchRecords)
			.mockReturnValue(new Promise<RecordPageResponse>(() => {}));

		const { getByTestId, queryByTestId } = renderScreen();

		await waitFor(() => {
			expect(getByTestId("collection-records-loading")).toBeTruthy();
		});
		expect(getByTestId("collection-records-screen")).toBeTruthy();
		// the other half of the offline surface's ordering guard: a genuine first
		// load is still a skeleton, so the paused branch cannot be widened to
		// swallow it.
		expect(queryByTestId("collection-records-offline")).toBeNull();
	});

	it("shows the offline surface when the first page is paused with nothing cached", async () => {
		onlineManager.setOnline(false);

		const { getByTestId, getByText, queryByTestId } = renderScreen();

		await waitFor(() => {
			expect(getByTestId("collection-records-offline")).toBeTruthy();
		});
		expect(getByText("You're offline")).toBeTruthy();
		expect(
			getByText("Records will load as soon as you're back online."),
		).toBeTruthy();
		expect(getByTestId("collection-records-offline-status")).toBeTruthy();
		expect(getByText("Waiting for a connection")).toBeTruthy();
		// nothing to press, and no skeleton pulsing over a fetch that never left.
		expect(queryByTestId("collection-records-retry-button")).toBeNull();
		expect(queryByTestId("collection-records-loading")).toBeNull();
		expect(fetchRecords).not.toHaveBeenCalled();
	});

	it("keeps the loaded records on screen when the connection drops", async () => {
		jest
			.mocked(fetchRecords)
			.mockResolvedValue(
				page({ docs: [{ id: "r1", title: "A field guide" }], totalDocs: 1 }),
			);

		const screen = renderScreen();

		await waitFor(() => {
			expect(screen.getByText("A field guide")).toBeTruthy();
		});

		// going offline and invalidating pauses the refetch, so the query reports
		// `paused` with the first page still cached — the state the offline surface
		// must not claim.
		onlineManager.setOnline(false);
		await act(async () => {
			void screen.client.invalidateQueries();
		});
		// the library batches its listener notifications, so first wait for the
		// pause to reach the cache — without this the assertions below read the
		// render from before the pause and prove nothing.
		await waitFor(() => {
			expect(
				screen.client
					.getQueryCache()
					.getAll()
					.some((query) => query.state.fetchStatus === "paused"),
			).toBe(true);
		});
		// then re-render, so the assertions read the paused state now rather than a
		// beat later, when React happens to apply the batched notification.
		screen.rerender(
			<QueryClientProvider client={screen.client}>
				<CollectionRecordsScreen slug="posts" />
			</QueryClientProvider>,
		);

		expect(screen.getByText("A field guide")).toBeTruthy();
		expect(screen.queryByTestId("collection-records-offline")).toBeNull();

		// coming back online resumes that paused refetch by itself — the point of
		// wiring `onlineManager` at all — so settle it inside the test rather than
		// leaving a paused fetch to resume during teardown.
		await act(async () => {
			onlineManager.setOnline(true);
		});
		await waitFor(() => {
			expect(fetchRecords).toHaveBeenCalledTimes(2);
		});
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

		// seed the virtualized list's layout/content metrics (no real layout runs
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
			undefined,
		);
	});

	it("shows no search field for a collection holding no records", async () => {
		jest.mocked(fetchRecords).mockResolvedValue(page({}));

		const { getByTestId, queryByTestId } = renderScreen();

		await waitFor(() => {
			expect(getByTestId("collection-records-empty")).toBeTruthy();
		});
		expect(queryByTestId("collection-records-search")).toBeNull();
	});

	it("replaces the feed with what the server matched, and counts the matches", async () => {
		respondWith(
			page({
				docs: [
					{ id: "r1", title: "A field guide" },
					{ id: "r2", title: "Release notes" },
				],
				totalDocs: 2,
			}),
			page({ docs: [{ id: "r2", title: "Release notes" }], totalDocs: 1 }),
		);

		const screen = renderScreen();
		await waitFor(() => {
			expect(screen.getByText("A field guide")).toBeTruthy();
		});

		await search(screen, "release");

		await waitFor(() => {
			expect(screen.getByText("Release notes")).toBeTruthy();
		});
		expect(screen.queryByText("A field guide")).toBeNull();
		expect(screen.getByText("1 matching record")).toBeTruthy();
	});

	it("asks the server only about the fields the loaded records carry", async () => {
		respondWith(
			page({ docs: [{ id: "r1", slug: "a-field-guide" }], totalDocs: 1 }),
			page({ docs: [], totalDocs: 0 }),
		);

		const screen = renderScreen();
		await waitFor(() => {
			expect(screen.getByText("a-field-guide")).toBeTruthy();
		});

		await search(screen, "guide");

		await waitFor(() => {
			expect(jest.mocked(fetchRecords).mock.calls.length).toBeGreaterThan(1);
		});
		expect(fetchRecords).toHaveBeenLastCalledWith(
			"https://cms.example.com",
			"jwt-token",
			"posts",
			1,
			{ query: "guide", fields: ["slug"] },
		);
	});

	it("finds a record by the id typed into the field", async () => {
		respondWith(
			page({ docs: [{ id: "r1", title: "A field guide" }], totalDocs: 1 }),
			page({ docs: [], totalDocs: 0 }),
		);
		jest
			.mocked(findRecordById)
			.mockResolvedValue({ id: "r9", title: "Found by id" });

		const screen = renderScreen();
		await waitFor(() => {
			expect(screen.getByText("A field guide")).toBeTruthy();
		});

		await search(screen, "r9");

		await waitFor(() => {
			expect(screen.getByText("Found by id")).toBeTruthy();
		});
		expect(screen.getByText("1 matching record")).toBeTruthy();
	});

	// the section is fixed under the screen header rather than carried by the
	// list, which is what keeps the query editable from a feed it emptied.
	it("states that nothing matched, and clears back to the whole feed", async () => {
		respondWith(
			page({ docs: [{ id: "r1", title: "A field guide" }], totalDocs: 1 }),
			page({ docs: [], totalDocs: 0 }),
		);

		const screen = renderScreen();
		await waitFor(() => {
			expect(screen.getByText("A field guide")).toBeTruthy();
		});

		await search(screen, "kubernetes");

		await waitFor(() => {
			expect(screen.getByTestId("collection-records-no-matches")).toBeTruthy();
		});
		expect(
			screen.getByText("No records match \u201Ckubernetes\u201D."),
		).toBeTruthy();
		expect(screen.getByTestId("collection-records-search")).toBeTruthy();
		expect(screen.getByText("No matching records")).toBeTruthy();

		// the message stands where the cards would be rather than inside the feed:
		// `MessageState` carries the horizontal safe-area inset on the
		// understanding that it meets the screen's own edge, so nesting it in the
		// list's already-inset content container would draw it at both paddings.
		expect(screen.queryByTestId("collection-records-list")).toBeNull();

		fireEvent.press(
			screen.getByTestId("collection-records-clear-search-button"),
		);

		await waitFor(() => {
			expect(screen.getByText("A field guide")).toBeTruthy();
		});
		expect(screen.getByText("1 record")).toBeTruthy();
	});

	// the id lookup prepends its record to the first page, and the field search
	// can return that same record again on a later page — it is only checked
	// against the page it was prepended to. the rows are deduplicated by id, so
	// the reader never sees the same card twice.
	it("lists a record once when the id match reappears on a later page", async () => {
		jest
			.mocked(fetchRecords)
			.mockImplementation(
				async (_serverUrl, _token, _slug, pageParam, term) => {
					if (term === undefined) {
						return page({
							docs: [{ id: "r1", title: "A field guide" }],
							totalDocs: 1,
						});
					}

					return pageParam === 1
						? page({
								docs: [{ id: "r5", title: "Another match" }],
								totalDocs: 2,
								hasNextPage: true,
								nextPage: 2,
							})
						: page({
								docs: [{ id: "r9", title: "Found by id" }],
								totalDocs: 2,
							});
				},
			);
		jest
			.mocked(findRecordById)
			.mockResolvedValue({ id: "r9", title: "Found by id" });

		const screen = renderScreen();
		await waitFor(() => {
			expect(screen.getByText("A field guide")).toBeTruthy();
		});

		await search(screen, "r9");

		await waitFor(() => {
			expect(screen.getByText("Found by id")).toBeTruthy();
		});

		// seed the virtualized list's layout/content metrics (no real layout runs
		// in the test renderer) so scrolling to the bottom computes a distance and
		// fires onEndReached.
		const list = screen.getByTestId("collection-records-list");
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
			expect(screen.getByText("Another match")).toBeTruthy();
		});
		// page 2 returned the id-matched record a second time; one card is drawn.
		expect(screen.getAllByText("Found by id")).toHaveLength(1);
	});

	it("shows the feed's own failure surface when a search fails", async () => {
		jest
			.mocked(fetchRecords)
			.mockImplementation(async (_serverUrl, _token, _slug, _page, term) => {
				if (term !== undefined) {
					throw new PayloadRequestError("network", "unreachable");
				}

				return page({
					docs: [{ id: "r1", title: "A field guide" }],
					totalDocs: 1,
				});
			});

		const screen = renderScreen();
		await waitFor(() => {
			expect(screen.getByText("A field guide")).toBeTruthy();
		});

		await search(screen, "release");

		await waitFor(() => {
			expect(screen.getByTestId("collection-records-error")).toBeTruthy();
		});
		// the section stays, so the query that failed can be changed or dropped.
		expect(screen.getByTestId("collection-records-search")).toBeTruthy();
		expect(screen.getByTestId("collection-records-retry-button")).toBeTruthy();
		// and the failure takes the screen below it rather than riding inside the
		// feed's own padding, for the same reason the no-match surface does.
		expect(screen.queryByTestId("collection-records-list")).toBeNull();
	});

	// the collection's records carry none of the eight title-ish fields, so the
	// field query is never sent and the id lookup is the search's only request.
	// a connectivity failure there has to reach the screen: read as "no id
	// match" it would report that nothing matched, which is a different claim.
	it("fails the search when its only request fails, rather than reporting no matches", async () => {
		respondWith(
			page({ docs: [{ id: "r1", views: 12 }], totalDocs: 1 }),
			page({ docs: [], totalDocs: 0 }),
		);
		jest
			.mocked(findRecordById)
			.mockRejectedValue(new PayloadRequestError("network", "unreachable"));

		const screen = renderScreen();
		await waitFor(() => {
			expect(screen.getByTestId("collection-record-list-item-r1")).toBeTruthy();
		});

		await search(screen, "r9");

		await waitFor(() => {
			expect(screen.getByTestId("collection-records-error")).toBeTruthy();
		});
		expect(screen.queryByTestId("collection-records-no-matches")).toBeNull();
		// the field query was never sent: no record carries a field to search.
		expect(
			jest
				.mocked(fetchRecords)
				.mock.calls.every(([, , , , term]) => term === undefined),
		).toBe(true);
	});

	// a stack header and the tab bar clear this screen's vertical edges, so it
	// owns only the horizontal pair — carried on the feed's content container
	// rather than the list itself. Unistyles' jest mock reports zero insets, so
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
