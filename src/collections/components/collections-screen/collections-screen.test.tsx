import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { fireEvent, waitFor } from "@testing-library/react-native";
import { renderRouter } from "expo-router/testing-library";
import CollectionDetailRoute from "~/app/(tabs)/collections/[slug]";
import { useCollections } from "~/collections/queries/use-collections";
import { PayloadRequestError } from "~/common/helpers/payload-client";
import { CollectionsScreen } from "./collections-screen";

jest.mock("~/collections/queries/use-collections");

const mockUseCollections = jest.mocked(useCollections);

/** Sets the mocked query result; only the fields the screen reads matter. */
function setResult(
	result: Partial<ReturnType<typeof useCollections>>,
): jest.Mock {
	const refetch = jest.fn();
	mockUseCollections.mockReturnValue({
		data: undefined,
		isPending: false,
		isError: false,
		error: null,
		refetch,
		...result,
	} as unknown as ReturnType<typeof useCollections>);
	return refetch as unknown as jest.Mock;
}

function renderScreen() {
	return renderRouter(
		{
			"collections/index": () => <CollectionsScreen />,
			"collections/[slug]": CollectionDetailRoute,
		},
		{ initialUrl: "/collections" },
	);
}

afterEach(() => {
	jest.clearAllMocks();
});

describe("<CollectionsScreen>", () => {
	it("shows the loading skeleton while the query is pending", async () => {
		setResult({ isPending: true });

		const { getByTestId } = renderScreen();

		await waitFor(() => {
			expect(getByTestId("collections-loading")).toBeTruthy();
		});
		expect(getByTestId("collections-screen")).toBeTruthy();
	});

	it("shows an error state with a retry that refetches", () => {
		const refetch = setResult({
			isError: true,
			error: new PayloadRequestError("network", "unreachable"),
		});

		const { getByTestId, getByText } = renderScreen();

		expect(getByTestId("collections-error")).toBeTruthy();
		expect(getByText("Couldn't load")).toBeTruthy();

		fireEvent.press(getByTestId("collections-retry-button"));
		expect(refetch).toHaveBeenCalledTimes(1);
	});

	it("shows a permission message with no retry on an auth failure", () => {
		setResult({
			isError: true,
			error: new PayloadRequestError("auth", "rejected", 403),
		});

		const { getByTestId, getByText, queryByTestId } = renderScreen();

		expect(getByTestId("collections-error")).toBeTruthy();
		expect(getByText("Can't access collections")).toBeTruthy();
		expect(queryByTestId("collections-retry-button")).toBeNull();
	});

	it("shows the empty state when there are no collections", () => {
		setResult({ data: [] });

		const { getByTestId, getByText } = renderScreen();

		expect(getByTestId("collections-empty")).toBeTruthy();
		expect(getByText("No collections")).toBeTruthy();
	});

	it("lists the collections", () => {
		setResult({
			data: [
				{ slug: "posts", label: "Posts" },
				{ slug: "media", label: "Media" },
			],
		});

		const { getByTestId, getByText } = renderScreen();

		expect(getByTestId("collection-list-item-posts")).toBeTruthy();
		expect(getByText("Posts")).toBeTruthy();
		expect(getByText("Media")).toBeTruthy();
	});

	it("opens the placeholder detail screen when a row is pressed", () => {
		setResult({ data: [{ slug: "blog-posts", label: "Blog Posts" }] });

		const { getByTestId, getByText } = renderScreen();

		fireEvent.press(getByTestId("collection-list-item-blog-posts"));

		expect(getByTestId("collection-detail-screen")).toBeTruthy();
		expect(getByText("Records coming soon")).toBeTruthy();
		expect(
			getByText(
				"Browsing the records in Blog Posts lands in a follow-up update.",
			),
		).toBeTruthy();
	});
});
