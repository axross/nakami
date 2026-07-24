import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	jest,
} from "@jest/globals";
import { QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, waitFor } from "@testing-library/react-native";
import { renderRouter } from "expo-router/testing-library";
import CollectionRecordsRoute from "~/app/(tabs)/collections/[slug]";
import type { Session } from "~/auth/models/session";
import { useAuthStore } from "~/auth/stores/auth-store";
import { fetchAccess } from "~/collections/helpers/fetch-access";
import { fetchRecords } from "~/collections/helpers/fetch-records";
import { PayloadRequestError } from "~/common/helpers/payload-client";
import { createTestQueryClient } from "~/common/helpers/test-query-client";
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

/** Render the screen under a fresh, isolated QueryClient so the real query runs. */
function renderScreen() {
	const client = createTestQueryClient();
	return renderRouter(
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
	);
}

beforeEach(() => {
	jest.clearAllMocks();
	// The query is gated on an active session and reads the token non-reactively
	// from the store; seed one so the real query runs.
	useAuthStore.setState({ status: "authenticated", session: SESSION });
});

afterEach(() => {
	useAuthStore.setState({ status: "unauthenticated", session: null });
});

describe("<CollectionsScreen>", () => {
	it("shows the loading skeleton while the query is pending", async () => {
		jest
			.mocked(fetchAccess)
			.mockReturnValue(
				new Promise<Awaited<ReturnType<typeof fetchAccess>>>(() => {}),
			);

		const { getByTestId } = renderScreen();

		await waitFor(() => {
			expect(getByTestId("collections-loading")).toBeTruthy();
		});
		expect(getByTestId("collections-screen")).toBeTruthy();
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
});
