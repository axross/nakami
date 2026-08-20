import { afterEach, describe, expect, it, jest } from "@jest/globals";
import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen } from "@testing-library/react-native";
import type { JSX, ReactNode } from "react";
import { Text } from "react-native";
import type { Session } from "~/auth/models/session";
import { useAuthStore } from "~/auth/stores/auth-store";
import {
	createPendingWriteQueue,
	type PendingWrite,
	type PendingWriteQueue,
} from "~/collections/helpers/pending-write-queue";
import { updateRecordField } from "~/collections/helpers/update-record-field";
import type { RecordDocument } from "~/collections/models/record";
import { getCollectionRecordQueryOptions } from "~/collections/queries/collection-record-query";
import { PayloadRequestError } from "~/common/helpers/payload-client";
import { createTestQueryClient } from "~/common/test-helpers/query-client";
import {
	PendingWriteProvider,
	usePendingWriteQueue,
	usePendingWriteState,
} from "./pending-write-provider";

/**
 * the provider reads the query client, because a change that lands has to reach
 * the record cache. every render here therefore needs one, and it is a
 * throwaway per test rather than the application's own.
 */
let client: QueryClient | null = null;

function renderProvided(children: ReactNode) {
	client = createTestQueryClient();

	return render(
		<QueryClientProvider client={client}>{children}</QueryClientProvider>,
	);
}

afterEach(() => {
	client?.clear();
	client = null;
	// the auth store is a module singleton, so a session left behind would be one
	// test's state showing up in the next one's.
	useAuthStore.setState({ status: "unauthenticated", session: null });
});

// the queue the provider builds for itself writes through this; the network
// state it is triggered by has no native side under jest, so both are mocked.
jest.mock("~/collections/helpers/update-record-field", () => ({
	updateRecordField: jest.fn(),
}));

const SESSION: Session = {
	serverUrl: "https://cms.example.com",
	collectionSlug: "users",
	token: "jwt-token",
	exp: 9_999_999_999,
	user: { id: "user-1", email: "you@example.com" },
};

/** a queue whose sender never settles, so an enqueued change stays queued. */
function createStuckQueue(): PendingWriteQueue {
	return createPendingWriteQueue({
		send: () => new Promise<void>(() => {}),
		connectivity: {
			subscribe() {
				return () => {};
			},
		},
	});
}

/**
 * a queue whose server turns the session's token away, which is what an expired
 * token does to a change. it is refused nothing — an auth failure is no verdict
 * on the value — so it stays queued, and the only thing left that can save it is
 * a drain fired by a new token.
 *
 * its connectivity source reports nothing at all, which leaves the queue on its
 * own optimistic "online" and is exactly the case this matters in: the token
 * expired without the connection ever dropping, so no connectivity event is
 * coming to drain it. that also makes the assertions below exact — every send
 * these tests count was fired by something they did.
 */
function createTokenRejectingQueue() {
	let isTokenAccepted = false;
	const send = jest.fn(async () => {
		if (!isTokenAccepted) {
			throw new PayloadRequestError(
				"auth",
				"Authentication was rejected.",
				401,
			);
		}
	});

	return {
		send,
		acceptToken() {
			isTokenAccepted = true;
		},
		queue: createPendingWriteQueue({
			send,
			connectivity: {
				subscribe() {
					return () => {};
				},
			},
		}),
	};
}

/** lets a drain the provider kicked without awaiting run to completion. */
async function settle(): Promise<void> {
	for (let turn = 0; turn < 8; turn += 1) {
		await Promise.resolve();
	}
}

function QueuedFields(): JSX.Element {
	const { writes } = usePendingWriteState();

	return (
		<Text>
			{writes.length === 0
				? "nothing queued"
				: writes.map((write) => write.fieldName).join(",")}
		</Text>
	);
}

const WRITE: PendingWrite = {
	slug: "posts",
	recordId: "a1",
	fieldName: "title",
	value: "Hello",
};

describe("<PendingWriteProvider>", () => {
	it("publishes the queue it was handed to everything beneath it", () => {
		const queue = createStuckQueue();
		const captured: { queue: PendingWriteQueue | null } = { queue: null };

		function Reader(): JSX.Element {
			captured.queue = usePendingWriteQueue();

			return <Text>read</Text>;
		}

		renderProvided(
			<PendingWriteProvider queue={queue}>
				<Reader />
			</PendingWriteProvider>,
		);

		expect(captured.queue).toBe(queue);
	});

	it("re-renders a subscriber as the queue's state changes", async () => {
		const queue = createStuckQueue();

		renderProvided(
			<PendingWriteProvider queue={queue}>
				<QueuedFields />
			</PendingWriteProvider>,
		);

		expect(screen.getByText("nothing queued")).toBeTruthy();

		await act(async () => {
			await queue.enqueue(WRITE);
		});

		expect(screen.getByText("title")).toBeTruthy();
	});

	it("leaves a queue it was handed for its owner to dispose", () => {
		const queue = createStuckQueue();
		const dispose = jest.spyOn(queue, "dispose");

		renderProvided(
			<PendingWriteProvider queue={queue}>
				<QueuedFields />
			</PendingWriteProvider>,
		).unmount();

		expect(dispose).not.toHaveBeenCalled();
	});

	// handed none, it builds one on this app's own transport — and that one is
	// its own to take down again, so the connectivity listener does not outlive
	// the stack it was mounted in.
	it("builds and disposes its own queue when handed none", () => {
		const captured: { queue: PendingWriteQueue | null } = { queue: null };

		function Reader(): JSX.Element {
			captured.queue = usePendingWriteQueue();

			return <Text>read</Text>;
		}

		const view = renderProvided(
			<PendingWriteProvider>
				<Reader />
			</PendingWriteProvider>,
		);
		const built = captured.queue;

		if (built === null) {
			throw new Error("expected the provider to publish a queue");
		}

		const dispose = jest.spyOn(built, "dispose");
		view.unmount();

		expect(dispose).toHaveBeenCalledTimes(1);
	});

	// connectivity is the queue's own trigger, and a token expires without the
	// connection ever dropping — so without this the held change would sit until
	// some unrelated network change happened along, which may never come.
	describe("draining on a new session token", () => {
		async function renderHeldChange() {
			useAuthStore.setState({ status: "authenticated", session: SESSION });

			const { queue, send, acceptToken } = createTokenRejectingQueue();
			const view = renderProvided(
				<PendingWriteProvider queue={queue}>
					<QueuedFields />
				</PendingWriteProvider>,
			);

			await act(async () => {
				await queue.enqueue(WRITE);
				await settle();
			});

			// tried once, turned away, and still owed to the server.
			expect(send).toHaveBeenCalledTimes(1);
			expect(queue.getState().writes).toEqual([WRITE]);
			expect(screen.getByText("title")).toBeTruthy();

			return { acceptToken, queue, send, view };
		}

		it("sends what a rejected token held back once a new one arrives", async () => {
			const { acceptToken, queue, send } = await renderHeldChange();

			acceptToken();
			await act(async () => {
				useAuthStore.setState({
					session: { ...SESSION, token: "refreshed-token" },
				});
				await settle();
			});

			expect(send).toHaveBeenCalledTimes(2);
			expect(queue.getState()).toEqual({ writes: [], refusals: [] });
			expect(screen.getByText("nothing queued")).toBeTruthy();
		});

		it("leaves the queue alone on a store change that brings no new token", async () => {
			const { acceptToken, queue, send } = await renderHeldChange();

			acceptToken();
			await act(async () => {
				// a refresh that returned the same token, then a sign-out that leaves
				// none. neither makes a held change any more sendable than it was,
				// and draining on one would spend a request to learn that.
				useAuthStore.setState({
					session: { ...SESSION, user: { id: "user-1", email: "new@ex.com" } },
				});
				useAuthStore.setState({ status: "unauthenticated", session: null });
				await settle();
			});

			expect(send).toHaveBeenCalledTimes(1);
			expect(queue.getState().writes).toEqual([WRITE]);
		});

		it("stops listening for a new token once unmounted", async () => {
			const { acceptToken, send, view } = await renderHeldChange();

			view.unmount();
			acceptToken();

			await act(async () => {
				useAuthStore.setState({
					session: { ...SESSION, token: "refreshed-token" },
				});
				await settle();
			});

			expect(send).toHaveBeenCalledTimes(1);
		});
	});

	it("refuses to read a queue outside a provider", () => {
		function Reader(): JSX.Element {
			usePendingWriteQueue();

			return <Text>read</Text>;
		}

		expect(() => render(<Reader />)).toThrow(
			"usePendingWriteQueue() must be used within a <PendingWriteProvider> component.",
		);
	});

	// the queue the provider builds is the one that actually sends — a change
	// made offline reaches the server from a drain, long after the blur that
	// queued it returned — so this covers the whole path a save takes: the
	// queue's sender, the record-field mutation it builds, and the cache patch
	// that mutation makes when the server accepts the value.
	describe("the queue it builds for itself", () => {
		const SCOPE = { userId: "user-1", slug: "posts", recordId: "a1" };
		const { queryKey } = getCollectionRecordQueryOptions(SCOPE);

		function renderOwnQueue() {
			const captured: { queue: PendingWriteQueue | null } = { queue: null };

			function Reader(): JSX.Element {
				captured.queue = usePendingWriteQueue();

				return <Text>read</Text>;
			}

			const view = renderProvided(
				<PendingWriteProvider>
					<Reader />
				</PendingWriteProvider>,
			);

			if (captured.queue === null) {
				throw new Error("expected the provider to publish a queue");
			}

			return { queue: captured.queue, view };
		}

		it("writes the field through the session's server, then moves the cache", async () => {
			useAuthStore.setState({ status: "authenticated", session: SESSION });
			jest.mocked(updateRecordField).mockResolvedValue(undefined);
			const { queue } = renderOwnQueue();
			client?.setQueryData<RecordDocument>(queryKey, {
				id: "a1",
				title: "Original",
				views: 3,
			});

			await act(async () => {
				await queue.enqueue({ ...SCOPE, fieldName: "title", value: "Renamed" });
				await queue.drain();
			});

			expect(updateRecordField).toHaveBeenCalledWith(
				"https://cms.example.com",
				"jwt-token",
				"posts",
				"a1",
				"title",
				"Renamed",
			);
			// only the saved field moved, and nothing was invalidated: a refetch
			// would replace what is being typed into the screen's other inputs.
			expect(client?.getQueryData<RecordDocument>(queryKey)).toEqual({
				id: "a1",
				title: "Renamed",
				views: 3,
			});
			expect(client?.getQueryState(queryKey)?.isInvalidated).toBe(false);

			useAuthStore.setState({ status: "unauthenticated", session: null });
		});

		it("leaves the cache alone when the write is refused", async () => {
			useAuthStore.setState({ status: "authenticated", session: SESSION });
			jest
				.mocked(updateRecordField)
				.mockRejectedValue(new Error("Unexpected response (400)."));
			const { queue } = renderOwnQueue();
			client?.setQueryData<RecordDocument>(queryKey, {
				id: "a1",
				title: "Original",
			});

			await act(async () => {
				await queue.enqueue({ ...SCOPE, fieldName: "title", value: "Renamed" });
				await queue.drain();
			});

			expect(client?.getQueryData<RecordDocument>(queryKey)?.title).toBe(
				"Original",
			);

			useAuthStore.setState({ status: "unauthenticated", session: null });
		});
	});
});
