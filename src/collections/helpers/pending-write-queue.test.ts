import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { PayloadRequestError } from "~/common/helpers/payload-client";
import {
	type ConnectivitySource,
	createPendingWriteQueue,
	type PendingWrite,
} from "./pending-write-queue";

/** a connectivity source a test drives by hand, reporting its state on subscribe. */
function createFakeConnectivity(isOnline: boolean) {
	const listeners = new Set<(online: boolean) => void>();

	return {
		source: {
			subscribe(onChange) {
				listeners.add(onChange);
				onChange(isOnline);

				return () => {
					listeners.delete(onChange);
				};
			},
		} satisfies ConnectivitySource,
		set(online: boolean) {
			for (const listener of listeners) {
				listener(online);
			}
		},
		get subscriberCount() {
			return listeners.size;
		},
	};
}

/** a sender that records what it was given and how many sends overlapped. */
function createRecordingSender() {
	const sent: PendingWrite[] = [];
	let inFlight = 0;
	let peakInFlight = 0;

	const send = jest.fn(async (write: PendingWrite) => {
		sent.push(write);
		inFlight += 1;
		peakInFlight = Math.max(peakInFlight, inFlight);
		// two turns of the microtask queue: enough for a second send to start
		// were nothing holding it back.
		await Promise.resolve();
		await Promise.resolve();
		inFlight -= 1;
	});

	return {
		send,
		sent,
		get peakInFlight() {
			return peakInFlight;
		},
	};
}

function writeOf(fieldName: string, value: unknown): PendingWrite {
	return { slug: "posts", recordId: "a1", fieldName, value };
}

beforeEach(() => {
	jest.clearAllMocks();
});

describe("createPendingWriteQueue()", () => {
	it("sends a change straight away while the device is online", async () => {
		const sender = createRecordingSender();
		const queue = createPendingWriteQueue({
			send: sender.send,
			connectivity: createFakeConnectivity(true).source,
		});

		await queue.enqueue(writeOf("title", "Hello"));
		await queue.drain();

		expect(sender.sent).toEqual([writeOf("title", "Hello")]);
		expect(queue.getState()).toEqual({ writes: [], refusals: [] });
	});

	it("sends nothing while offline, and everything once connectivity returns", async () => {
		const sender = createRecordingSender();
		const connectivity = createFakeConnectivity(false);
		const queue = createPendingWriteQueue({
			send: sender.send,
			connectivity: connectivity.source,
		});

		await queue.enqueue(writeOf("title", "Hello"));
		await queue.enqueue(writeOf("views", 3));

		expect(sender.send).not.toHaveBeenCalled();
		expect(queue.getState().writes).toHaveLength(2);

		connectivity.set(true);
		await queue.drain();

		// oldest first: the order the edits were made in is the order they land.
		expect(sender.sent).toEqual([
			writeOf("title", "Hello"),
			writeOf("views", 3),
		]);
		expect(queue.getState().writes).toEqual([]);
	});

	it("replaces a queued change for the same field, sending only the last value", async () => {
		const sender = createRecordingSender();
		const connectivity = createFakeConnectivity(false);
		const queue = createPendingWriteQueue({
			send: sender.send,
			connectivity: connectivity.source,
		});

		await queue.enqueue(writeOf("title", "First"));
		await queue.enqueue(writeOf("title", "Second"));
		await queue.enqueue(writeOf("title", "Third"));

		expect(queue.getState().writes).toEqual([writeOf("title", "Third")]);

		connectivity.set(true);
		await queue.drain();

		expect(sender.send).toHaveBeenCalledTimes(1);
		expect(sender.sent).toEqual([writeOf("title", "Third")]);
	});

	it("never has two changes in flight at once", async () => {
		const sender = createRecordingSender();
		const connectivity = createFakeConnectivity(false);
		const queue = createPendingWriteQueue({
			send: sender.send,
			connectivity: connectivity.source,
		});

		await queue.enqueue(writeOf("title", "Hello"));
		await queue.enqueue(writeOf("views", 3));
		connectivity.set(true);
		await queue.drain();

		expect(sender.send).toHaveBeenCalledTimes(2);
		expect(sender.peakInFlight).toBe(1);
	});

	it("drops a refused change and surfaces what the server said", async () => {
		const send = jest.fn(async (write: PendingWrite) => {
			if (write.fieldName === "title") {
				throw new PayloadRequestError(
					"server",
					"Unexpected response (400).",
					400,
				);
			}
		});
		const queue = createPendingWriteQueue({
			send,
			connectivity: createFakeConnectivity(true).source,
		});

		await queue.enqueue(writeOf("title", "Hello"));
		await queue.enqueue(writeOf("views", 3));
		await queue.drain();

		expect(queue.getState()).toEqual({
			writes: [],
			refusals: [
				{
					target: { slug: "posts", recordId: "a1", fieldName: "title" },
					message: "Unexpected response (400).",
				},
			],
		});
		// the refusal is this one change's, so the rest of the queue still goes.
		expect(send).toHaveBeenCalledTimes(2);
	});

	// the transport's own "Unexpected response (400)." tells a user nothing.
	// where Payload named the field, its message for *that* field is what the row
	// shows.
	it("prefers the server's per-field message over the transport's", async () => {
		const send = jest.fn(async () => {
			throw new PayloadRequestError(
				"server",
				"Unexpected response (400).",
				400,
				undefined,
				{
					message: "The following field is invalid: Title",
					fieldErrors: [
						{ path: "title", message: "This field is required." },
						{ path: "slug", message: "Another field's problem." },
					],
				},
			);
		});
		const queue = createPendingWriteQueue({
			send,
			connectivity: createFakeConnectivity(true).source,
		});

		await queue.enqueue(writeOf("title", ""));
		await queue.drain();

		expect(queue.getState().refusals[0]?.message).toBe(
			"This field is required.",
		);
	});

	it("falls back to the refusal's summary when it named no field", async () => {
		const send = jest.fn(async () => {
			throw new PayloadRequestError(
				"server",
				"Unexpected response (400).",
				400,
				undefined,
				{ message: "This record is locked by another user.", fieldErrors: [] },
			);
		});
		const queue = createPendingWriteQueue({
			send,
			connectivity: createFakeConnectivity(true).source,
		});

		await queue.enqueue(writeOf("title", "Hello"));
		await queue.drain();

		expect(queue.getState().refusals[0]?.message).toBe(
			"This record is locked by another user.",
		);
	});

	it("clears a refusal when the field is edited again", async () => {
		const send = jest
			.fn<(write: PendingWrite) => Promise<void>>()
			.mockRejectedValueOnce(new PayloadRequestError("server", "Refused.", 400))
			.mockResolvedValue(undefined);
		const queue = createPendingWriteQueue({
			send,
			connectivity: createFakeConnectivity(true).source,
		});

		await queue.enqueue(writeOf("title", "Hello"));
		await queue.drain();
		expect(queue.getState().refusals).toHaveLength(1);

		await queue.enqueue(writeOf("title", "Second"));
		expect(queue.getState().refusals).toEqual([]);

		await queue.drain();
		expect(queue.getState()).toEqual({ writes: [], refusals: [] });
	});

	it("keeps a change queued when the device turns out to be unreachable", async () => {
		const attempted: string[] = [];
		let isReachable = false;
		const send = jest.fn(async (write: PendingWrite) => {
			attempted.push(write.fieldName);

			if (!isReachable) {
				throw new PayloadRequestError(
					"network",
					"The server could not be reached.",
				);
			}
		});
		const queue = createPendingWriteQueue({
			send,
			connectivity: createFakeConnectivity(true).source,
		});

		await queue.enqueue(writeOf("title", "Hello"));
		await queue.enqueue(writeOf("views", 3));
		await queue.drain();

		// nothing behind the failed change is ever attempted, so what is queued
		// keeps both its members and its order.
		expect(new Set(attempted)).toEqual(new Set(["title"]));
		expect(queue.getState()).toEqual({
			writes: [writeOf("title", "Hello"), writeOf("views", 3)],
			refusals: [],
		});

		isReachable = true;
		await queue.drain();

		expect(attempted.slice(-2)).toEqual(["title", "views"]);
		expect(queue.getState().writes).toEqual([]);
	});

	it("notifies its subscribers as the queue changes, and stops on unsubscribe", async () => {
		const sender = createRecordingSender();
		const queue = createPendingWriteQueue({
			send: sender.send,
			connectivity: createFakeConnectivity(true).source,
		});
		const listener = jest.fn();
		const unsubscribe = queue.subscribe(listener);

		await queue.enqueue(writeOf("title", "Hello"));
		await queue.drain();

		expect(listener.mock.calls.length).toBeGreaterThanOrEqual(2);

		unsubscribe();
		listener.mockClear();

		await queue.enqueue(writeOf("views", 3));
		await queue.drain();

		expect(listener).not.toHaveBeenCalled();
	});

	it("stops listening for connectivity once disposed", async () => {
		const sender = createRecordingSender();
		const connectivity = createFakeConnectivity(false);
		const queue = createPendingWriteQueue({
			send: sender.send,
			connectivity: connectivity.source,
		});

		await queue.enqueue(writeOf("title", "Hello"));
		queue.dispose();
		connectivity.set(true);
		await queue.drain();

		expect(connectivity.subscriberCount).toBe(0);
		expect(sender.send).not.toHaveBeenCalled();
	});
});
