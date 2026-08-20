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
	within,
} from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import type { Session } from "~/auth/models/session";
import { useAuthStore } from "~/auth/stores/auth-store";
import { PendingWriteProvider } from "~/collections/components/pending-write-provider/pending-write-provider";
import { fetchAccess } from "~/collections/helpers/fetch-access";
import { fetchRecord } from "~/collections/helpers/fetch-record";
import {
	createPendingWriteQueue,
	type PendingWrite,
	type PendingWriteQueue,
} from "~/collections/helpers/pending-write-queue";
import type { AccessResponse } from "~/collections/models/collection";
import { accessResponseSchema } from "~/collections/models/collection";
import type { RecordDocument } from "~/collections/models/record";
import { recordSchema } from "~/collections/models/record";
import { getCollectionRecordQueryOptions } from "~/collections/queries/collection-record-query";
import { PayloadRequestError } from "~/common/helpers/payload-client";
import { createTestQueryClient } from "~/common/test-helpers/query-client";
import { themes } from "~/unistyles";
import { CollectionRecordScreen } from "./collection-record-screen";

// the loading skeleton pulls in react-native-reanimated (v4 → react-native-
// worklets), whose real module throws on import under jest. redirect it to the
// project's manual mock — the same substitution expo-router's testing-library
// makes for suites that render through it.
jest.mock("react-native-reanimated", () =>
	require("react-native-reanimated/mock"),
);

// the screen titles the stack header with the record's own derived title, which
// needs a navigator this suite deliberately does without: navigation is the
// route's business and the e2e suite's, and everything asserted here is what
// the screen draws below the header. the stub captures the title anyway, so the
// one thing the header does carry can still be checked.
const mockScreenOptions = jest.fn();

jest.mock("expo-router", () => ({
	Stack: {
		Screen: ({ options }: { options: { title: string } }) => {
			mockScreenOptions(options);

			return null;
		},
	},
}));

// mock the transport; the queries, their factories, the field model, and the
// pending-write queue all run for real.
jest.mock("~/collections/helpers/fetch-record", () => ({
	fetchRecord: jest.fn(),
}));
jest.mock("~/collections/helpers/fetch-access", () => ({
	fetchAccess: jest.fn(),
}));

const SESSION: Session = {
	serverUrl: "https://cms.example.com",
	collectionSlug: "users",
	token: "jwt-token",
	exp: 9_999_999_999,
	user: { id: "user-1", email: "you@example.com" },
};

const SLUG = "posts";
const RECORD_ID = "a1";

/** a record carrying one field of every kind the screen has a control for. */
const RECORD: RecordDocument = recordSchema.parse({
	id: RECORD_ID,
	title: "Shipping v2 is out",
	readingMinutes: 7,
	featured: true,
	seo: { title: "Shipping v2", noIndex: false },
	content: { root: { type: "root", children: [] } },
	archivedAt: null,
	createdAt: "2026-08-12T09:00:00.000Z",
	updatedAt: "2026-08-19T09:00:00.000Z",
});

const UNRESTRICTED: AccessResponse = accessResponseSchema.parse({
	collections: { posts: { read: true, update: true, fields: true } },
});

let activeClient: QueryClient | null = null;
/** every change the queue actually sent, in the order it sent them. */
let sent: PendingWrite[] = [];
let resolveSend: (() => void) | null = null;

/**
 * renders the screen under a fresh cache and a queue whose sender is observable
 * — the screen's whole write path runs, and this is what it writes into.
 */
function renderScreen({
	existingQueue,
	send,
	slug = SLUG,
	recordId = RECORD_ID,
}: {
	/**
	 * a queue built by an earlier render, for the cases about what does and does
	 * not survive the screen — the real one is mounted on the Collections stack
	 * and outlives every screen inside it.
	 */
	existingQueue?: PendingWriteQueue;
	send?: (write: PendingWrite) => Promise<void>;
	slug?: string;
	recordId?: string;
} = {}) {
	const client = createTestQueryClient();
	activeClient = client;
	const queue =
		existingQueue ??
		createPendingWriteQueue({
			send:
				send ??
				(async (write) => {
					sent.push(write);
				}),
			connectivity: {
				subscribe(onChange) {
					onChange(onlineManager.isOnline());

					return onlineManager.subscribe((isOnline) => {
						onChange(isOnline);
					});
				},
			},
		});

	return Object.assign(
		render(
			<QueryClientProvider client={client}>
				<PendingWriteProvider queue={queue}>
					<CollectionRecordScreen recordId={recordId} slug={slug} />
				</PendingWriteProvider>
			</QueryClientProvider>,
		),
		{ client, queue },
	);
}

/** renders and waits for the loaded field list. */
async function renderLoaded(options?: Parameters<typeof renderScreen>[0]) {
	jest.mocked(fetchRecord).mockResolvedValue(RECORD);
	jest.mocked(fetchAccess).mockResolvedValue(UNRESTRICTED);

	const view = renderScreen(options);

	await waitFor(() => {
		expect(view.getByTestId("record-field-title-input")).toBeTruthy();
	});

	return view;
}

beforeEach(() => {
	jest.clearAllMocks();
	sent = [];
	resolveSend = null;
	useAuthStore.setState({ status: "authenticated", session: SESSION });
});

afterEach(() => {
	// order matters for the offline tests, exactly as it does for the record
	// feed's suite. unmount first, so a resumed query does not land its state
	// update outside `act`; then empty the cache, so a paused fetch is cancelled
	// rather than resumed; then restore the process-wide `onlineManager`.
	cleanup();
	activeClient?.clear();
	activeClient = null;
	onlineManager.setOnline(true);
	useAuthStore.setState({ status: "unauthenticated", session: null });
});

describe("<CollectionRecordScreen>", () => {
	describe("loading", () => {
		it("shows the skeleton while the record is on its way", async () => {
			jest.mocked(fetchRecord).mockReturnValue(new Promise<never>(() => {}));
			jest.mocked(fetchAccess).mockResolvedValue(UNRESTRICTED);

			const { getByTestId, queryByTestId } = renderScreen();

			await waitFor(() => {
				expect(getByTestId("collection-record-loading")).toBeTruthy();
			});
			// the other half of the offline surface's ordering guard: a genuine first
			// load is still a skeleton, so the paused branch cannot be widened.
			expect(queryByTestId("collection-record-offline")).toBeNull();
		});

		it("waits for the access map as well as the record", async () => {
			jest.mocked(fetchRecord).mockResolvedValue(RECORD);
			jest.mocked(fetchAccess).mockReturnValue(new Promise<never>(() => {}));

			const { getByTestId } = renderScreen();

			// without the access map a row cannot say whether it may be edited, so
			// drawing one early would offer edits the server will silently drop.
			await waitFor(() => {
				expect(getByTestId("collection-record-loading")).toBeTruthy();
			});
		});

		it("shows the offline state rather than a pulsing placeholder", async () => {
			jest.mocked(fetchRecord).mockResolvedValue(RECORD);
			jest.mocked(fetchAccess).mockResolvedValue(UNRESTRICTED);
			act(() => {
				onlineManager.setOnline(false);
			});

			const { getByTestId, queryByTestId } = renderScreen();

			await waitFor(() => {
				expect(getByTestId("collection-record-offline")).toBeTruthy();
			});
			expect(queryByTestId("collection-record-loading")).toBeNull();
		});
	});

	describe("failing to load", () => {
		it("states a permission failure calmly, with no retry", async () => {
			jest
				.mocked(fetchRecord)
				.mockRejectedValue(
					new PayloadRequestError("auth", "Authentication was rejected.", 403),
				);
			jest.mocked(fetchAccess).mockResolvedValue(UNRESTRICTED);

			const { getByTestId, queryByTestId } = renderScreen();

			await waitFor(() => {
				expect(getByTestId("collection-record-error")).toBeTruthy();
			});
			expect(queryByTestId("collection-record-retry-button")).toBeNull();
		});

		it("offers a retry that reloads on any other failure", async () => {
			jest
				.mocked(fetchRecord)
				.mockRejectedValueOnce(
					new PayloadRequestError("server", "Unexpected response (500).", 500),
				)
				.mockResolvedValue(RECORD);
			jest.mocked(fetchAccess).mockResolvedValue(UNRESTRICTED);

			const { getByTestId } = renderScreen();

			await waitFor(() => {
				expect(getByTestId("collection-record-retry-button")).toBeTruthy();
			});
			fireEvent.press(getByTestId("collection-record-retry-button"));

			await waitFor(() => {
				expect(getByTestId("record-field-title-input")).toBeTruthy();
			});
		});

		// nothing is asked of the server for a route that addresses no record: a
		// request that cannot succeed would be reported as a server fault.
		it.each([
			["no slug", "", RECORD_ID],
			["no record id", SLUG, ""],
		])(
			"states a route with %s without asking for a retry it does not offer",
			async (_, slug, recordId) => {
				const { getByTestId, getByText, queryByTestId, queryByText } =
					renderScreen({ recordId, slug });

				await waitFor(() => {
					expect(getByTestId("collection-record-error")).toBeTruthy();
				});
				expect(fetchRecord).not.toHaveBeenCalled();
				// retrying cannot mend a route, so the button that implies it might is
				// not offered.
				expect(queryByTestId("collection-record-retry-button")).toBeNull();
				expect(getByText("Couldn't open this link")).toBeTruthy();
				expect(getByText("It doesn't point to a record.")).toBeTruthy();
				// the copy and the absent action are pinned together deliberately:
				// this surface borrowed the generic load-failure subtitle once, which
				// ended by telling the user to try again on a screen giving them no
				// way to. nothing here may ask for one — neither a button nor a
				// sentence.
				expect(queryByText(/try again/i)).toBeNull();
			},
		);
	});

	describe("the loaded field list", () => {
		it("draws one row per field, in the server's order with id first", async () => {
			const { getAllByTestId, getByTestId } = await renderLoaded();

			expect(getByTestId("collection-record-fields")).toBeTruthy();
			expect(
				getAllByTestId(/^record-field-[^-]+$/).map(
					(row) => row.props.testID as string,
				),
			).toEqual([
				"record-field-id",
				"record-field-title",
				"record-field-readingMinutes",
				"record-field-featured",
				"record-field-seo",
				"record-field-content",
				"record-field-archivedAt",
				"record-field-createdAt",
				"record-field-updatedAt",
			]);
		});

		it("gives each kind the control that matches it, pre-filled", async () => {
			const { getByTestId, getByText } = await renderLoaded();

			expect(getByTestId("record-field-title-input").props.value).toBe(
				"Shipping v2 is out",
			);
			expect(getByTestId("record-field-readingMinutes-input").props.value).toBe(
				"7",
			);
			expect(getByTestId("record-field-featured-input").props.value).toBe(true);
			expect(getByTestId("record-field-seo-input").props.value).toBe(
				'{\n  "title": "Shipping v2",\n  "noIndex": false\n}',
			);
			// and each row still names its field.
			expect(getByText("Reading Minutes")).toBeTruthy();
			expect(getByText("readingMinutes")).toBeTruthy();
		});

		it("locks the four kinds of row that cannot be edited", async () => {
			const { getByText, queryByTestId } = await renderLoaded();

			for (const name of [
				"id",
				"createdAt",
				"updatedAt",
				"content",
				"archivedAt",
			]) {
				expect(queryByTestId(`record-field-${name}-input`)).toBeNull();
			}
			expect(getByText("Not editable here yet")).toBeTruthy();
			expect(getByText("No value")).toBeTruthy();
			expect(getByText("Rich Text")).toBeTruthy();
		});

		it("locks a field the access response denies update on", async () => {
			jest.mocked(fetchRecord).mockResolvedValue(RECORD);
			jest.mocked(fetchAccess).mockResolvedValue(
				accessResponseSchema.parse({
					collections: {
						posts: {
							read: true,
							update: true,
							fields: { title: true, readingMinutes: { read: true } },
						},
					},
				}),
			);

			const { getByTestId, queryByTestId } = renderScreen();

			await waitFor(() => {
				expect(getByTestId("record-field-title-input")).toBeTruthy();
			});
			expect(queryByTestId("record-field-readingMinutes-input")).toBeNull();
			// scoped to the row: every field the map does not mention is denied
			// too, so the screen states this in several places at once.
			expect(
				within(getByTestId("record-field-readingMinutes")).getByText(
					"No permission",
				),
			).toBeTruthy();
			expect(
				within(getByTestId("record-field-title")).queryByText("No permission"),
			).toBeNull();
		});

		it("locks every row of a collection denied update", async () => {
			jest.mocked(fetchRecord).mockResolvedValue(RECORD);
			jest.mocked(fetchAccess).mockResolvedValue(
				accessResponseSchema.parse({
					collections: { posts: { read: true, fields: true } },
				}),
			);

			const { getAllByTestId, queryByTestId } = renderScreen();

			await waitFor(() => {
				expect(getAllByTestId(/^record-field-[^-]+$/)).toHaveLength(9);
			});
			for (const name of Object.keys(RECORD)) {
				expect(queryByTestId(`record-field-${name}-input`)).toBeNull();
			}
		});

		it("titles the stack header with the record's own derived title", async () => {
			await renderLoaded();

			expect(mockScreenOptions).toHaveBeenLastCalledWith({
				title: "Shipping v2 is out",
			});
		});

		// Unistyles' jest mock reports zero insets, so this is the zero-inset
		// device: the fields' padding has to fall back to the design gutter rather
		// than collapsing to the raw inset. it is carried on the scrolling content
		// container rather than the scroll view itself.
		it("keeps the fields' horizontal gutter when the runtime reports no insets", async () => {
			const { getByTestId } = await renderLoaded();

			const fields = StyleSheet.flatten(
				getByTestId("collection-record-fields").props.contentContainerStyle,
			);

			expect(fields.paddingStart).toBe(themes.light.gap.md);
			expect(fields.paddingEnd).toBe(themes.light.gap.md);
		});
	});

	describe("saving", () => {
		it("sends only the blurred field, and marks the row until it lands", async () => {
			const pending = new Promise<void>((resolve) => {
				resolveSend = resolve;
			});
			const { getByTestId, getByText, queryByText } = await renderLoaded({
				send: async (write) => {
					sent.push(write);
					await pending;
				},
			});

			const input = getByTestId("record-field-title-input");
			fireEvent.changeText(input, "Shipping v2 is out — revised");
			await act(async () => {
				fireEvent(input, "blur");
			});

			expect(sent).toEqual([
				{
					slug: SLUG,
					recordId: RECORD_ID,
					fieldName: "title",
					value: "Shipping v2 is out — revised",
				},
			]);
			expect(getByText("Not saved yet")).toBeTruthy();

			await act(async () => {
				resolveSend?.();
				await pending;
			});

			await waitFor(() => {
				expect(queryByText("Not saved yet")).toBeNull();
			});
		});

		it("sends a number as a number, and does not re-read the record", async () => {
			const { client, getByTestId } = await renderLoaded();
			const { queryKey } = getCollectionRecordQueryOptions({
				userId: SESSION.user.id,
				slug: SLUG,
				recordId: RECORD_ID,
			});

			const input = getByTestId("record-field-readingMinutes-input");
			fireEvent.changeText(input, "12");
			await act(async () => {
				fireEvent(input, "blur");
			});

			await waitFor(() => {
				expect(sent).toHaveLength(1);
			});
			expect(sent[0]).toEqual({
				slug: SLUG,
				recordId: RECORD_ID,
				fieldName: "readingMinutes",
				value: 12,
			});
			// one fetch, and the entry is left fresh: a save patches the cached
			// record (see the provider, which owns the write path) rather than
			// invalidating it, which is what keeps the other inputs holding what is
			// being typed into them.
			expect(fetchRecord).toHaveBeenCalledTimes(1);
			expect(client.getQueryState(queryKey)?.isInvalidated).toBe(false);
		});

		// the queue's mutex is what guarantees this; the screen's part is handing
		// every change to that queue rather than firing its own request.
		it("keeps two saves in quick succession from interleaving", async () => {
			const order: string[] = [];
			const { getByTestId } = await renderLoaded({
				send: async (write) => {
					order.push(`start:${write.fieldName}`);
					await Promise.resolve();
					order.push(`end:${write.fieldName}`);
				},
			});

			const title = getByTestId("record-field-title-input");
			const minutes = getByTestId("record-field-readingMinutes-input");

			// the typing is flushed first — a change and the blur that follows it
			// cannot share one `act`, or the blur handler still closes over the
			// text as it was before the change. the two *blurs* are what has to
			// land together, and they do.
			fireEvent.changeText(title, "One");
			fireEvent.changeText(minutes, "9");
			await act(async () => {
				fireEvent(title, "blur");
				fireEvent(minutes, "blur");
			});

			await waitFor(() => {
				expect(order).toHaveLength(4);
			});
			expect(order).toEqual([
				"start:title",
				"end:title",
				"start:readingMinutes",
				"end:readingMinutes",
			]);
		});

		it("keeps the typed value and shows what the server said about a refusal", async () => {
			const { getByTestId, getByText } = await renderLoaded({
				send: async () => {
					throw new PayloadRequestError(
						"server",
						"Unexpected response (400).",
						400,
						undefined,
						{
							message: "The following field is invalid: Title",
							fieldErrors: [
								{ path: "title", message: "This field is required." },
							],
						},
					);
				},
			});

			const input = getByTestId("record-field-title-input");
			fireEvent.changeText(input, "");
			await act(async () => {
				fireEvent(input, "blur");
			});

			await waitFor(() => {
				expect(getByText("This field is required.")).toBeTruthy();
			});
			expect(getByTestId("record-field-title-input").props.value).toBe("");
			expect(getByText("Refused")).toBeTruthy();
		});

		// the queue is mounted on the whole Collections stack, so it outlives any
		// one record screen. a refusal describes a value that left with the screen
		// that produced it: keeping it would put a "Refused" marker and a message
		// about an emptied field over the perfectly good value the reopened row
		// seeds from the record.
		it("leaves its refusals behind when the screen is closed and reopened", async () => {
			const refuse = async () => {
				throw new PayloadRequestError(
					"server",
					"Unexpected response (400).",
					400,
					undefined,
					{
						message: "The following field is invalid: Title",
						fieldErrors: [
							{ path: "title", message: "This field is required." },
						],
					},
				);
			};
			const view = await renderLoaded({ send: refuse });
			const input = view.getByTestId("record-field-title-input");

			fireEvent.changeText(input, "");
			await act(async () => {
				fireEvent(input, "blur");
			});
			await waitFor(() => {
				expect(view.getByText("This field is required.")).toBeTruthy();
			});

			// closed the way the stack closes it, and its cache emptied with it, so
			// the reopened screen re-reads the record exactly as a fresh visit
			// would. the queue is the one thing carried across — it belongs to the
			// stack, not to either screen.
			view.unmount();
			view.client.clear();

			const reopened = await renderLoaded({ existingQueue: view.queue });

			expect(reopened.queryByText("This field is required.")).toBeNull();
			expect(reopened.queryByText("Refused")).toBeNull();
			expect(reopened.getByTestId("record-field-title-input").props.value).toBe(
				RECORD.title,
			);
		});

		it("falls back to the refusal's summary when it named no field", async () => {
			const { getByTestId, getByText } = await renderLoaded({
				send: async () => {
					throw new PayloadRequestError(
						"server",
						"Unexpected response (400).",
						400,
						undefined,
						{ message: "This record is locked.", fieldErrors: [] },
					);
				},
			});

			const input = getByTestId("record-field-title-input");
			fireEvent.changeText(input, "Renamed");
			await act(async () => {
				fireEvent(input, "blur");
			});

			await waitFor(() => {
				expect(getByText("This record is locked.")).toBeTruthy();
			});
		});
	});

	describe("editing with no connection", () => {
		it("marks the row, sends nothing, and sends once the connection returns", async () => {
			const view = await renderLoaded();

			act(() => {
				onlineManager.setOnline(false);
			});

			const input = view.getByTestId("record-field-title-input");
			fireEvent.changeText(input, "Written offline");
			await act(async () => {
				fireEvent(input, "blur");
			});

			expect(sent).toEqual([]);
			expect(view.getByText("Not saved yet")).toBeTruthy();
			expect(view.getByTestId("collection-record-offline-notice")).toBeTruthy();

			// no user action: coming back online is the whole trigger.
			await act(async () => {
				onlineManager.setOnline(true);
				await Promise.resolve();
			});

			await waitFor(() => {
				expect(sent).toHaveLength(1);
			});
			expect(sent[0]?.value).toBe("Written offline");
		});

		it("sends one request carrying the last value for a field edited twice", async () => {
			const view = await renderLoaded();

			act(() => {
				onlineManager.setOnline(false);
			});

			const input = view.getByTestId("record-field-title-input");
			fireEvent.changeText(input, "First");
			await act(async () => {
				fireEvent(input, "blur");
			});
			fireEvent.changeText(input, "Second");
			await act(async () => {
				fireEvent(input, "blur");
			});

			expect(sent).toEqual([]);

			await act(async () => {
				onlineManager.setOnline(true);
				await Promise.resolve();
			});

			await waitFor(() => {
				expect(sent).toHaveLength(1);
			});
			expect(sent[0]?.value).toBe("Second");
		});

		it("shows no offline notice while the connection is up", async () => {
			const { queryByTestId } = await renderLoaded();

			expect(queryByTestId("collection-record-offline-notice")).toBeNull();
		});
	});
});
