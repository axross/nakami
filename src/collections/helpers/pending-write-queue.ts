import { Mutex } from "async-mutex";
import { PayloadRequestError } from "~/common/helpers/payload-client";
import { createModuleLogger } from "~/core/helpers/logging";

const logger = createModuleLogger("collections/pending-write-queue");

/** the one field of the one record a queued change belongs to. */
export interface PendingWriteTarget {
	readonly slug: string;
	readonly recordId: string;
	readonly fieldName: string;
}

/** a single-field change waiting to reach the server. */
export interface PendingWrite extends PendingWriteTarget {
	readonly value: unknown;
}

/** a change the server would not accept, and what it said about it. */
export interface RefusedWrite {
	readonly target: PendingWriteTarget;
	/** the failure's own message, which the row shows beneath the typed value. */
	readonly message: string;
}

/** everything a screen reads off the queue, as one immutable snapshot. */
export interface PendingWriteState {
	/** the changes still to be sent, in the order they will be sent. */
	readonly writes: readonly PendingWrite[];
	readonly refusals: readonly RefusedWrite[];
}

/** sends one change, rejecting the way the Payload client does. */
export type PendingWriteSender = (write: PendingWrite) => Promise<void>;

/**
 * where the queue learns whether the device can reach the server. it is an
 * injected port rather than a direct read so the queue can be driven from a
 * test with no device under it.
 */
export interface ConnectivitySource {
	/**
	 * subscribes to connectivity, returning the unsubscribe. a source that
	 * already knows the current state reports it on subscription rather than
	 * waiting for the next change.
	 */
	subscribe(onChange: (isOnline: boolean) => void): () => void;
}

/** how a {@link PendingWriteQueue} reaches the server and the network. */
export interface PendingWriteQueueOptions {
	readonly send: PendingWriteSender;
	readonly connectivity: ConnectivitySource;
}

/** an in-memory queue of unsent single-field changes. */
export interface PendingWriteQueue {
	/**
	 * queues a change, replacing whatever was queued for the same field, and
	 * sends it when the device is online. resolves once the change is queued,
	 * not once it is sent — the outcome arrives through {@link getState}.
	 */
	enqueue(write: PendingWrite): Promise<void>;
	/** sends what is queued, oldest first, for as long as the device is online. */
	drain(): Promise<void>;
	getState(): PendingWriteState;
	/** subscribes to state changes, returning the unsubscribe. */
	subscribe(listener: () => void): () => void;
	/** stops listening for connectivity. the queued changes are simply dropped. */
	dispose(): void;
}

const EMPTY_STATE: PendingWriteState = { writes: [], refusals: [] };

function keyOf(target: PendingWriteTarget): string {
	return JSON.stringify([target.slug, target.recordId, target.fieldName]);
}

function toTarget({ slug, recordId, fieldName }: PendingWrite) {
	return { slug, recordId, fieldName };
}

/**
 * whether a failure means the device could not reach the server, as opposed to
 * the server having refused the change. the two part ways in the queue: one
 * leaves the change queued for the next drain, the other takes it out.
 */
function isUnreachable(error: unknown): boolean {
	return error instanceof PayloadRequestError && error.kind === "network";
}

function describeRefusal(error: unknown): string {
	return error instanceof Error ? error.message : "The change was refused.";
}

/**
 * builds a queue of single-field changes that have not reached the server yet,
 * so a field can be edited with no connection and still be saved once there is
 * one.
 *
 * a change for a field that already has one queued **replaces** it, so a field
 * edited repeatedly offline costs one request carrying the last value rather
 * than one per edit. the queue drains oldest-first, and both halves — queueing
 * and draining — run under one mutex, so no two changes are ever in flight at
 * once and a change queued mid-drain cannot overtake what is already being
 * sent.
 *
 * a change the server refuses leaves the queue and is not retried; its message
 * lands in {@link PendingWriteState.refusals} for the row to show, and editing
 * the field again queues a fresh change. a change that fails because the device
 * is unreachable stays queued, and the next connectivity change sends it.
 *
 * nothing here is a module singleton: a caller builds its own queue and hands
 * it down, which is what lets a test mount one with its own sender and its own
 * connectivity.
 */
export function createPendingWriteQueue({
	send,
	connectivity,
}: PendingWriteQueueOptions): PendingWriteQueue {
	const mutex = new Mutex();
	// a Map, because re-setting an existing key replaces the value while keeping
	// the key where it already sat — a re-edited field keeps its place in line.
	const writes = new Map<string, PendingWrite>();
	const refusals = new Map<string, RefusedWrite>();
	const listeners = new Set<() => void>();
	// optimistic until the source says otherwise, matching how the query client
	// seeds `onlineManager`. a wrong guess costs nothing: the send fails as
	// unreachable and the change stays queued.
	let isOnline = true;
	let state: PendingWriteState = EMPTY_STATE;

	function publish(): void {
		state = {
			writes: [...writes.values()],
			refusals: [...refusals.values()],
		};

		for (const listener of listeners) {
			listener();
		}
	}

	async function drain(): Promise<void> {
		await mutex.runExclusive(async () => {
			if (writes.size === 0 || !isOnline) {
				return;
			}

			const startedAt = performance.now();
			let sent = 0;
			let refused = 0;

			logger.debug("Started draining pending record-field writes.", {
				queued: writes.size,
			});

			while (isOnline) {
				const next: [string, PendingWrite] | undefined = writes
					.entries()
					.next().value;

				if (next === undefined) {
					break;
				}

				const [key, write] = next;

				try {
					await send(write);
					writes.delete(key);
					sent += 1;
				} catch (error) {
					if (isUnreachable(error)) {
						// left queued deliberately: the next connectivity change is
						// what sends it, and stopping here keeps the order intact.
						break;
					}

					writes.delete(key);
					refusals.set(key, {
						target: toTarget(write),
						message: describeRefusal(error),
					});
					refused += 1;
					// the field name is a schema identifier; the value the user typed
					// never reaches a log line or a breadcrumb.
					logger.warn("Refused a pending record-field write.", {
						slug: write.slug,
						fieldName: write.fieldName,
					});
				}

				publish();
			}

			logger.debug("Completed draining pending record-field writes.", {
				sent,
				refused,
				remaining: writes.size,
				duration: performance.now() - startedAt,
			});
		});
	}

	/**
	 * kicks a drain nobody awaits. the failure paths a change can take are all
	 * handled inside the loop, so anything reaching here came from the queue
	 * itself — worth a line rather than an unhandled rejection.
	 */
	function startDrain(): void {
		drain().catch((error: unknown) => {
			logger.warn("Failed draining pending record-field writes.", {
				reason: error instanceof Error ? error.message : "unknown",
			});
		});
	}

	async function enqueue(write: PendingWrite): Promise<void> {
		await mutex.runExclusive(() => {
			const key = keyOf(write);

			writes.set(key, write);
			// the row is about to show the change as unsent, so whatever the last
			// attempt was refused for no longer describes it.
			refusals.delete(key);
			publish();
		});

		// deliberately not awaited, and deliberately outside the lock above: the
		// caller is a blur handler, and the send is what it must not wait on.
		startDrain();
	}

	const unsubscribe = connectivity.subscribe((online) => {
		isOnline = online;

		if (online) {
			startDrain();
		}
	});

	return {
		enqueue,
		drain,
		getState: () => state,
		subscribe(listener) {
			listeners.add(listener);

			return () => {
				listeners.delete(listener);
			};
		},
		dispose: unsubscribe,
	};
}
