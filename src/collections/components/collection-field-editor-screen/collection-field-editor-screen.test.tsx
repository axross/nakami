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
import { Alert } from "react-native";

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
import { createTestQueryClient } from "~/common/test-helpers/query-client";
import { resolveStyle } from "~/common/test-helpers/resolve-style";
import { themes } from "~/unistyles";
import { CollectionFieldEditorScreen } from "./collection-field-editor-screen";

// the message state pulls in react-native-reanimated (v4 → react-native-
// worklets), whose real module throws on import under jest.
jest.mock("react-native-reanimated", () =>
	require("react-native-reanimated/mock"),
);

// `back()` runs the screen's own `beforeRemove` listeners, the way a real
// GO_BACK does. That ordering is the whole point: a departure Save starts
// happens in the same tick as the press, before React has re-rendered
// anything, and a guard that read its dirtiness from the last render would
// still be the dirty one.
const mockBack = jest.fn(() => {
	leave();
});
const mockSetOptions = jest.fn();
const mockDispatch = jest.fn();
/** every `beforeRemove` listener the screen registered, newest last. */
let mockRemoveListeners: ((event: BeforeRemoveEvent) => void)[] = [];

/** the shape of the one navigation event this screen intercepts. */
interface BeforeRemoveEvent {
	preventDefault: () => void;
	data: { action: { type: string } };
}

jest.mock("expo-router", () => ({
	useNavigation: () => ({
		addListener: (
			event: string,
			listener: (event: BeforeRemoveEvent) => void,
		) => {
			if (event === "beforeRemove") {
				mockRemoveListeners.push(listener);
			}

			return () => {
				mockRemoveListeners = mockRemoveListeners.filter(
					(candidate) => candidate !== listener,
				);
			};
		},
		dispatch: mockDispatch,
		setOptions: mockSetOptions,
	}),
	useRouter: () => ({ back: mockBack }),
}));

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
const BODY = "First line\nSecond line";

const RECORD: RecordDocument = recordSchema.parse({
	id: RECORD_ID,
	title: "Shipping v2 is out",
	body: BODY,
	seo: { title: "Shipping v2", noIndex: false },
	readingMinutes: 7,
	archivedAt: null,
	createdAt: "2026-08-12T09:00:00.000Z",
	updatedAt: "2026-08-19T09:00:00.000Z",
});

const UNRESTRICTED: AccessResponse = accessResponseSchema.parse({
	collections: { posts: { read: true, update: true, fields: true } },
});

/** an access response denying update on one field, leaving the rest alone. */
const BODY_DENIED: AccessResponse = accessResponseSchema.parse({
	collections: {
		posts: {
			read: true,
			update: true,
			fields: { body: { update: false } },
		},
	},
});

let activeClient: QueryClient | null = null;
let activeQueue: PendingWriteQueue | null = null;
let sent: PendingWrite[] = [];

function renderEditor({
	access = UNRESTRICTED,
	fieldName = "body",
	recordId = RECORD_ID,
	slug = SLUG,
}: {
	access?: AccessResponse;
	fieldName?: string;
	recordId?: string;
	slug?: string;
} = {}) {
	jest.mocked(fetchRecord).mockResolvedValue(RECORD);
	jest.mocked(fetchAccess).mockResolvedValue(access);

	const client = createTestQueryClient();
	activeClient = client;
	const queue: PendingWriteQueue = createPendingWriteQueue({
		send: async (write) => {
			sent.push(write);
		},
		connectivity: {
			subscribe(onChange) {
				onChange(onlineManager.isOnline());

				return onlineManager.subscribe((isOnline) => {
					onChange(isOnline);
				});
			},
		},
	});

	activeQueue = queue;

	return Object.assign(
		render(
			<QueryClientProvider client={client}>
				<PendingWriteProvider queue={queue}>
					<CollectionFieldEditorScreen
						fieldName={fieldName}
						recordId={recordId}
						slug={slug}
					/>
				</PendingWriteProvider>
			</QueryClientProvider>,
		),
		{ client, queue },
	);
}

/** renders and waits for the editor to have a field to edit. */
async function renderLoaded(options?: Parameters<typeof renderEditor>[0]) {
	const view = renderEditor(options);

	await waitFor(() => {
		expect(view.getByTestId("collection-field-editor-input")).toBeTruthy();
	});

	return view;
}

/** the departure the sheet's own Cancel and the platform's back both produce. */
function leave(): BeforeRemoveEvent {
	const event: BeforeRemoveEvent = {
		preventDefault: jest.fn(),
		data: { action: { type: "GO_BACK" } },
	};

	for (const listener of mockRemoveListeners) {
		listener(event);
	}

	return event;
}

/** presses one of the buttons the discard confirmation offered. */
function pressAlertButton(label: string): void {
	const [, , buttons] = jest.mocked(Alert.alert).mock.calls[0] ?? [];
	const button = buttons?.find((candidate) => candidate.text === label);

	button?.onPress?.();
}

beforeEach(() => {
	jest.clearAllMocks();
	jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
	sent = [];
	mockRemoveListeners = [];
	useAuthStore.setState({ status: "authenticated", session: SESSION });
});

afterEach(() => {
	cleanup();
	activeClient?.clear();
	activeClient = null;
	// the queue this suite builds is its own — the provider is handed one rather
	// than building it, so nothing else drops its connectivity subscription.
	activeQueue?.dispose();
	activeQueue = null;
	jest.restoreAllMocks();
});

describe("<CollectionFieldEditorScreen>", () => {
	describe("the field it opens on", () => {
		it("opens on the record's value, named by both its label and its Payload name", async () => {
			const { getByTestId, getByText } = await renderLoaded();

			expect(getByTestId("collection-field-editor-input").props.value).toBe(
				BODY,
			);
			expect(getByText("Body")).toBeTruthy();
			expect(getByText("body")).toBeTruthy();
		});

		it("opens raw JSON on the same text the row previewed", async () => {
			const { getByTestId } = await renderLoaded({ fieldName: "seo" });

			expect(getByTestId("collection-field-editor-input").props.value).toBe(
				'{\n  "title": "Shipping v2",\n  "noIndex": false\n}',
			);
		});

		// the sheet is reached by a route, and a route is a link. these three are
		// not states a row can produce, so each gets the treatment an unaddressed
		// record gets rather than an editor over a value it cannot send back.
		it.each<[string, Parameters<typeof renderEditor>[0]]>([
			["a field the record does not carry", { fieldName: "nonexistent" }],
			["a field that is not editable", { access: BODY_DENIED }],
			["a field the row edits in place", { fieldName: "title" }],
			["a field that is server-assigned", { fieldName: "id" }],
			["a route naming no field at all", { fieldName: "" }],
		])(
			"states that it cannot edit %s, and offers only a way back",
			async (_, options) => {
				const { getByTestId, queryByTestId } = renderEditor(options);

				await waitFor(() => {
					expect(
						getByTestId("collection-field-editor-unavailable"),
					).toBeTruthy();
				});
				expect(queryByTestId("collection-field-editor-input")).toBeNull();

				fireEvent.press(getByTestId("collection-field-editor-close-button"));

				expect(mockBack).toHaveBeenCalled();
			},
		);
	});

	// opening this from a link rather than from the record is the one path that
	// arrives with nothing cached, and it is the path that would have seen a
	// failure state flash before the record ever answered.
	it("says nothing at all while the record is still on its way", async () => {
		// held open deliberately, and released before the test ends — a promise
		// that never settles would keep a handle open and stop `jest` exiting,
		// which the project runs without `--forceExit`.
		let release: (() => void) | undefined;
		const held = new Promise<RecordDocument>((resolve) => {
			release = () => {
				resolve(RECORD);
			};
		});

		jest.mocked(fetchRecord).mockReturnValue(held);
		jest.mocked(fetchAccess).mockResolvedValue(UNRESTRICTED);

		const client = createTestQueryClient();
		activeClient = client;
		const queue = createPendingWriteQueue({
			send: async () => undefined,
			connectivity: { subscribe: () => () => undefined },
		});
		activeQueue = queue;

		const { getByTestId, queryByTestId } = render(
			<QueryClientProvider client={client}>
				<PendingWriteProvider queue={queue}>
					<CollectionFieldEditorScreen
						fieldName="body"
						recordId={RECORD_ID}
						slug={SLUG}
					/>
				</PendingWriteProvider>
			</QueryClientProvider>,
		);

		expect(getByTestId("collection-field-editor-loading")).toBeTruthy();
		expect(queryByTestId("collection-field-editor-unavailable")).toBeNull();
		expect(queryByTestId("collection-field-editor-input")).toBeNull();

		// and the wait resolves into the editor rather than into that failure.
		await act(async () => {
			release?.();
		});
		await waitFor(() => {
			expect(getByTestId("collection-field-editor-input")).toBeTruthy();
		});
	});

	describe("saving", () => {
		it("queues the edited value and closes", async () => {
			const { getByTestId } = await renderLoaded();

			fireEvent.changeText(
				getByTestId("collection-field-editor-input"),
				"First line\nSecond line\nThird line",
			);
			fireEvent.press(getByTestId("collection-field-editor-save"));

			await waitFor(() => {
				expect(sent).toEqual([
					{
						slug: SLUG,
						recordId: RECORD_ID,
						fieldName: "body",
						value: "First line\nSecond line\nThird line",
					},
				]);
			});
			expect(mockBack).toHaveBeenCalled();
		});

		it("sends raw JSON parsed", async () => {
			const { getByTestId } = await renderLoaded({ fieldName: "seo" });

			fireEvent.changeText(
				getByTestId("collection-field-editor-input"),
				'{"title": "Shipping v3", "noIndex": true}',
			);
			fireEvent.press(getByTestId("collection-field-editor-save"));

			await waitFor(() => {
				expect(sent[0]?.value).toEqual({
					title: "Shipping v3",
					noIndex: true,
				});
			});
		});

		// the record screen's own rule: leaving an input that was not changed
		// sends nothing.
		it("queues nothing when the text was not changed, and still closes", async () => {
			const { getByTestId } = await renderLoaded();

			fireEvent.press(getByTestId("collection-field-editor-save"));

			expect(sent).toEqual([]);
			expect(mockBack).toHaveBeenCalled();
		});

		// the server answers 200 to a value of the wrong type and stores `null`,
		// so text that cannot be read back is never sent.
		it("keeps the sheet open on raw JSON that will not parse, and says why", async () => {
			const { getByTestId, queryByTestId } = await renderLoaded({
				fieldName: "seo",
			});

			fireEvent.changeText(
				getByTestId("collection-field-editor-input"),
				'{"title": "Shipping v3"',
			);
			fireEvent.press(getByTestId("collection-field-editor-save"));

			expect(sent).toEqual([]);
			expect(mockBack).not.toHaveBeenCalled();
			expect(queryByTestId("collection-field-editor-error")).toBeTruthy();
			expect(getByTestId("collection-field-editor-input").props.value).toBe(
				'{"title": "Shipping v3"',
			);
		});

		it("clears that message as soon as the text moves again", async () => {
			const { getByTestId, queryByTestId } = await renderLoaded({
				fieldName: "seo",
			});
			const input = getByTestId("collection-field-editor-input");

			fireEvent.changeText(input, "[release");
			fireEvent.press(getByTestId("collection-field-editor-save"));
			expect(queryByTestId("collection-field-editor-error")).toBeTruthy();

			fireEvent.changeText(input, "[]");

			expect(queryByTestId("collection-field-editor-error")).toBeNull();
		});

		// blurring is not finishing here, unlike every control on the record
		// screen: the keyboard closing would otherwise queue a change nobody asked
		// to save.
		it("does not commit on blur", async () => {
			const { getByTestId } = await renderLoaded();
			const input = getByTestId("collection-field-editor-input");

			fireEvent.changeText(input, "Something else\nentirely");
			fireEvent(input, "blur");

			expect(sent).toEqual([]);
			expect(mockBack).not.toHaveBeenCalled();
		});
	});

	describe("discarding", () => {
		it("closes without asking when nothing was typed", async () => {
			const { getByTestId } = await renderLoaded();

			fireEvent.press(getByTestId("collection-field-editor-cancel"));

			expect(Alert.alert).not.toHaveBeenCalled();
		});

		it("asks before leaving once the text has changed", async () => {
			const { getByTestId } = await renderLoaded();

			fireEvent.changeText(
				getByTestId("collection-field-editor-input"),
				"Changed\ntext",
			);
			fireEvent.press(getByTestId("collection-field-editor-cancel"));

			expect(Alert.alert).toHaveBeenCalled();
			expect(mockDispatch).not.toHaveBeenCalled();
		});

		it("leaves when the discard is confirmed", async () => {
			const { getByTestId } = await renderLoaded();

			fireEvent.changeText(
				getByTestId("collection-field-editor-input"),
				"Changed\ntext",
			);
			fireEvent.press(getByTestId("collection-field-editor-cancel"));
			pressAlertButton("Discard");

			expect(mockDispatch).toHaveBeenCalledWith({ type: "GO_BACK" });
		});

		it("stays put when the edit is kept", async () => {
			const { getByTestId } = await renderLoaded();

			fireEvent.changeText(
				getByTestId("collection-field-editor-input"),
				"Changed\ntext",
			);
			fireEvent.press(getByTestId("collection-field-editor-cancel"));
			pressAlertButton("Keep editing");

			expect(mockDispatch).not.toHaveBeenCalled();
		});

		// the platform's own back control takes the same path Cancel does, without
		// going through the sheet's own chrome.
		it("asks the same question when the platform's back control is used", async () => {
			const { getByTestId } = await renderLoaded();

			fireEvent.changeText(
				getByTestId("collection-field-editor-input"),
				"Changed\ntext",
			);

			const event = leave();

			expect(event.preventDefault).toHaveBeenCalled();
			expect(Alert.alert).toHaveBeenCalled();
		});

		// Save is the user choosing to keep the text, so the departure it starts
		// must not then ask whether to throw it away. This is asserted through the
		// departure Save itself performs — the guard has to be right in that same
		// tick, before any re-render could have refreshed what it captured.
		it("does not ask about the departure a save itself starts", async () => {
			const { getByTestId } = await renderLoaded();

			fireEvent.changeText(
				getByTestId("collection-field-editor-input"),
				"Changed\ntext",
			);
			fireEvent.press(getByTestId("collection-field-editor-save"));

			expect(mockBack).toHaveBeenCalled();
			expect(Alert.alert).not.toHaveBeenCalled();
		});

		// the sheet's own drag never reaches JS in time to be prevented — React
		// Navigation drives `preventNativeDismiss` from a context only
		// `usePreventRemove` writes to, and expo-router does not re-export it. So
		// the drag is turned off exactly while there is an edit to lose.
		it("turns the dismiss gesture off while there is something to lose", async () => {
			const { getByTestId } = await renderLoaded();

			expect(mockSetOptions).toHaveBeenLastCalledWith({
				gestureEnabled: true,
			});

			fireEvent.changeText(
				getByTestId("collection-field-editor-input"),
				"Changed\ntext",
			);

			expect(mockSetOptions).toHaveBeenLastCalledWith({
				gestureEnabled: false,
			});
		});

		it("turns it back on once the text is back to what it was", async () => {
			const { getByTestId } = await renderLoaded();
			const input = getByTestId("collection-field-editor-input");

			fireEvent.changeText(input, "Changed\ntext");
			fireEvent.changeText(input, BODY);

			expect(mockSetOptions).toHaveBeenLastCalledWith({
				gestureEnabled: true,
			});
		});
	});

	// both header controls are text rather than boxes, so the 48pt target every
	// control on this screen keeps is extended past the ink rather than drawn.
	// Save is the one that had it missing.
	it("extends both header controls to the minimum touch target", async () => {
		const { getByTestId } = await renderLoaded();

		for (const testID of [
			"collection-field-editor-cancel",
			"collection-field-editor-save",
		]) {
			expect(getByTestId(testID).props.hitSlop).toEqual({
				bottom: themes.light.gap.sm,
				left: themes.light.gap.sm,
				right: themes.light.gap.sm,
				top: themes.light.gap.sm,
			});
		}
	});

	// the sheet draws no navigator header and reaches the bottom of the screen,
	// so it owns its bottom and horizontal edges. Unistyles' jest mock reports
	// zero insets, so what this pins is the gutter each edge falls back to — the
	// clearance itself is the manual on-device pass.
	it("keeps its own gutter when the runtime reports no insets", async () => {
		const { getByTestId } = await renderLoaded();
		const style = resolveStyle(
			getByTestId("collection-field-editor-body").props.style,
		);

		expect(style.paddingBottom).toBe(themes.light.gap.md);
		expect(style.paddingStart).toBe(themes.light.gap.md);
		expect(style.paddingEnd).toBe(themes.light.gap.md);
	});
});
