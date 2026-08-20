import { describe, expect, it, jest } from "@jest/globals";
import { act, render, screen } from "@testing-library/react-native";
import type { JSX } from "react";
import { Text } from "react-native";
import {
	createPendingWriteQueue,
	type PendingWrite,
	type PendingWriteQueue,
} from "~/collections/helpers/pending-write-queue";
import {
	PendingWriteProvider,
	usePendingWriteQueue,
	usePendingWriteState,
} from "./pending-write-provider";

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

		render(
			<PendingWriteProvider queue={queue}>
				<Reader />
			</PendingWriteProvider>,
		);

		expect(captured.queue).toBe(queue);
	});

	it("re-renders a subscriber as the queue's state changes", async () => {
		const queue = createStuckQueue();

		render(
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

		render(
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

		const view = render(
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
});
