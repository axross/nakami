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
	// made offline reaches the server from a drain, long after any mutation a
	// blur could have fired — so the cached record has to move from here.
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
