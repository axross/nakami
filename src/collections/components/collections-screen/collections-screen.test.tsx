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
	waitFor,
} from "@testing-library/react-native";
import { renderRouter } from "expo-router/testing-library";
import { StyleSheet } from "react-native";
import CollectionRecordsRoute from "~/app/(tabs)/collections/[slug]";
import type { Session } from "~/auth/models/session";
import { useAuthStore } from "~/auth/stores/auth-store";
import { fetchAccess } from "~/collections/helpers/fetch-access";
import { fetchRecords } from "~/collections/helpers/fetch-records";
import { PayloadRequestError } from "~/common/helpers/payload-client";
import { createTestQueryClient } from "~/common/helpers/test-query-client";
import { themes } from "~/unistyles";
import { CollectionsScreen } from "./collections-screen";

// Mock only the data layer the real query calls; the query, its factory, and
// the access→list mapping all run for real. `PayloadRequestError` stays real so
// the error-mapping path is exercised end to end. `fetch-records` is mocked too
// so that pressing a row (which navigates to the records screen) does not make a
// real request.
jest.mock("~/collections/helpers/fetch-access", () => ({
	fetchAccess: jest.fn(),
}));
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

let activeClient: QueryClient | null = null;

/**
 * Render the screen under a fresh, isolated QueryClient so the real query runs,
 * exposing that client so a test can drive the cache — invalidating a loaded
 * list is what reaches the "paused with collections already on screen" state.
 */
function renderScreen() {
	const client = createTestQueryClient();
	activeClient = client;

	return Object.assign(
		renderRouter(
			{
				"collections/index": () => (
					<QueryClientProvider client={client}>
						<CollectionsScreen />
					</QueryClientProvider>
				),
				"collections/[slug]": () => (
					<QueryClientProvider client={client}>
						<CollectionRecordsRoute />
					</QueryClientProvider>
				),
			},
			{ initialUrl: "/collections" },
		),
		{ client },
	);
}

beforeEach(() => {
	jest.clearAllMocks();
	// The query is gated on an active session and reads the token non-reactively
	// from the store; seed one so the real query runs.
	useAuthStore.setState({ status: "authenticated", session: SESSION });
});

afterEach(() => {
	// Order matters for the offline tests. Unmount first: coming back online
	// resumes a paused query, and a resumed query under a still-mounted tree
	// lands its state update outside `act`. Then empty the cache, so a paused
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

describe("<CollectionsScreen>", () => {
	it("shows the loading skeleton while the query is pending", async () => {
		jest
			.mocked(fetchAccess)
			.mockReturnValue(
				new Promise<Awaited<ReturnType<typeof fetchAccess>>>(() => {}),
			);

		const { getByTestId, queryByTestId } = renderScreen();

		await waitFor(() => {
			expect(getByTestId("collections-loading")).toBeTruthy();
		});
		expect(getByTestId("collections-screen")).toBeTruthy();
		// The other half of the offline surface's ordering guard: a genuine first
		// load is still a skeleton, so the paused branch cannot be widened to
		// swallow it.
		expect(queryByTestId("collections-offline")).toBeNull();
	});

	it("shows the offline surface when the first load is paused with nothing cached", async () => {
		onlineManager.setOnline(false);

		const { getByTestId, getByText, queryByTestId } = renderScreen();

		await waitFor(() => {
			expect(getByTestId("collections-offline")).toBeTruthy();
		});
		expect(getByText("You're offline")).toBeTruthy();
		expect(
			getByText("Collections will load as soon as you're back online."),
		).toBeTruthy();
		expect(getByTestId("collections-offline-status")).toBeTruthy();
		expect(getByText("Waiting for a connection")).toBeTruthy();
		// Nothing to press, and no skeleton pulsing over a fetch that never left.
		expect(queryByTestId("collections-retry-button")).toBeNull();
		expect(queryByTestId("collections-loading")).toBeNull();
		expect(fetchAccess).not.toHaveBeenCalled();
	});

	it("keeps the loaded list on screen when the connection drops", async () => {
		jest
			.mocked(fetchAccess)
			.mockResolvedValue({ collections: { posts: { read: true } } });

		const screen = renderScreen();

		await waitFor(() => {
			expect(screen.getByTestId("collection-list-item-posts")).toBeTruthy();
		});

		// Going offline and invalidating pauses the refetch, so the query reports
		// `paused` with the list still cached — the state the offline surface must
		// not claim.
		onlineManager.setOnline(false);
		await act(async () => {
			void screen.client.invalidateQueries();
		});
		// The library batches its listener notifications, so first wait for the
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
		// Then drain the timers `renderRouter` puts this suite on, so the
		// assertions read the paused state now rather than a beat later.
		await act(async () => {
			jest.runOnlyPendingTimers();
		});

		expect(screen.getByTestId("collection-list-item-posts")).toBeTruthy();
		expect(screen.queryByTestId("collections-offline")).toBeNull();

		// Coming back online resumes that paused refetch by itself — the point of
		// wiring `onlineManager` at all — so settle it inside the test rather than
		// leaving a paused fetch to resume during teardown.
		await act(async () => {
			onlineManager.setOnline(true);
		});
		await waitFor(() => {
			expect(fetchAccess).toHaveBeenCalledTimes(2);
		});
	});

	it("shows an error state with a retry that refetches", async () => {
		jest
			.mocked(fetchAccess)
			.mockRejectedValue(new PayloadRequestError("network", "unreachable"));

		const { getByTestId, getByText } = renderScreen();

		await waitFor(() => {
			expect(getByTestId("collections-error")).toBeTruthy();
		});
		expect(getByText("Couldn't load")).toBeTruthy();

		fireEvent.press(getByTestId("collections-retry-button"));
		await waitFor(() => {
			expect(fetchAccess).toHaveBeenCalledTimes(2);
		});
	});

	it("shows a permission message with no retry on an auth failure", async () => {
		jest
			.mocked(fetchAccess)
			.mockRejectedValue(new PayloadRequestError("auth", "rejected", 403));

		const { getByTestId, getByText, queryByTestId } = renderScreen();

		await waitFor(() => {
			expect(getByText("Can't access collections")).toBeTruthy();
		});
		expect(getByTestId("collections-error")).toBeTruthy();
		expect(queryByTestId("collections-retry-button")).toBeNull();
	});

	it("shows the empty state when there are no collections", async () => {
		jest.mocked(fetchAccess).mockResolvedValue({ collections: {} });

		const { getByTestId, getByText } = renderScreen();

		await waitFor(() => {
			expect(getByTestId("collections-empty")).toBeTruthy();
		});
		expect(getByText("No collections")).toBeTruthy();
	});

	it("lists the collections, humanized and sorted", async () => {
		jest.mocked(fetchAccess).mockResolvedValue({
			collections: { posts: { read: true }, media: { read: true } },
		});

		const { getByTestId, getByText } = renderScreen();

		await waitFor(() => {
			expect(getByTestId("collection-list-item-posts")).toBeTruthy();
		});
		expect(getByText("Posts")).toBeTruthy();
		expect(getByText("Media")).toBeTruthy();
	});

	it("opens the collection's records screen when a row is pressed", async () => {
		jest
			.mocked(fetchAccess)
			.mockResolvedValue({ collections: { "blog-posts": { read: true } } });
		jest.mocked(fetchRecords).mockResolvedValue({
			docs: [],
			totalDocs: 0,
			hasNextPage: false,
			nextPage: null,
		});

		const { getByTestId, getByText } = renderScreen();

		await waitFor(() => {
			expect(getByTestId("collection-list-item-blog-posts")).toBeTruthy();
		});

		fireEvent.press(getByTestId("collection-list-item-blog-posts"));

		expect(getByTestId("collection-records-screen")).toBeTruthy();
		await waitFor(() => {
			expect(getByTestId("collection-records-empty")).toBeTruthy();
		});
		expect(getByText("No records")).toBeTruthy();
	});

	// A stack header and the tab bar clear this screen's vertical edges, so it
	// owns only the horizontal pair — carried on the list's content container
	// rather than the list itself. Unistyles' jest mock reports zero insets, so
	// this is the zero-inset device: the card's margin has to fall back to the
	// design gutter rather than collapsing to the raw inset.
	it("keeps the list card's horizontal gutter when the runtime reports no insets", async () => {
		jest
			.mocked(fetchAccess)
			.mockResolvedValue({ collections: { posts: { read: true } } });

		const { getByTestId } = renderScreen();

		await waitFor(() => {
			expect(getByTestId("collection-list-item-posts")).toBeTruthy();
		});

		const card = StyleSheet.flatten(
			getByTestId("collections-list").props.contentContainerStyle,
		);

		expect(card.marginStart).toBe(themes.light.gap.md);
		expect(card.marginEnd).toBe(themes.light.gap.md);
	});
});
