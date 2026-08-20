import { Mutex } from "async-mutex";
import { PayloadRequestError } from "~/common/helpers/payload-client";
import { createModuleLogger } from "~/core/helpers/logging";

const logger = createModuleLogger("collections/pending-write-queue");

/** the one record a queued change belongs to. */
export interface PendingWriteRecord {
	readonly slug: string;
	readonly recordId: string;
}

/** the one field of the one record a queued change belongs to. */
export interface PendingWriteTarget extends PendingWriteRecord {
	readonly fieldName: string;
}

/** a single-field change waiting to reach the server. */
export interface PendingWrite extends PendingWriteTarget {
	readonly value: unknown;
}

/** a change the server would not accept, and what it said about it. */
export interface RefusedWrite {
	readonly target: PendingWriteTarget;
	/**
	 * what the row shows beneath the typed value — the server's own message for
	 * that field where it named one, its summary where it did not.
	 */
	readonly message: string;
	/**
	 * the value the server refused, kept so it can be corrected rather than
	 * retyped.
	 *
	 * an inline input holds its own refused text and needs nothing from here.
	 * A field edited in the dialog does: the input that held the text closed with
	 * the dialog, and the record's own value — the only other thing a reopened
	 * dialog could seed from — is the value that was there *before* the refused
	 * edit. seeding from that would silently discard what the user wrote and
	 * leave a refusal message pinned over a value nothing is wrong with.
	 */
	readonly value: unknown;
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
	/**
	 * sends what is queued, oldest first, for as long as the device is online.
	 * stops at the first change that got no verdict — see
	 * {@link createPendingWriteQueue} — leaving it and everything behind it
	 * queued for whatever drains next.
	 */
	drain(): Promise<void>;
	/**
	 * drops the refusals recorded against one record, leaving everything queued
	 * for it alone. a screen closing calls it: a refusal describes a value that
	 * left with the input it was typed into, and this queue outlives that input.
	 */
	clearRefusals(record: PendingWriteRecord): void;
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
 * whether a failure left the change without a verdict, as opposed to the server
 * having considered the value and said no. the two part ways in the queue: one
 * leaves the change queued, still owed a verdict, the other takes it out.
 *
 * two kinds qualify. a `"network"` failure never reached the server at all. an
 * `"auth"` one — the 401 or 403 an expired or rejected token earns — reached it
 * and was turned away at the door, before the value was ever looked at. that
 * second one is not exotic: the token lives two hours, `useSessionRefresh`
 * re-checks it every five minutes or on a return to the foreground, and a device
 * that sits offline across the expiry drains on reconnection — which is a
 * connectivity event, not a refresh one — so the stale token goes out first.
 * calling that a refusal would discard the edit and pin "Authentication was
 * rejected." under the field, as though the field were what was wrong.
 */
function isWithoutVerdict(error: unknown): boolean {
	return (
		error instanceof PayloadRequestError &&
		(error.kind === "network" || error.kind === "auth")
	);
}

/**
 * what the row shows beneath the value the user typed. the server's own words
 * come first, because "This field is required." is the only version of a
 * refusal that tells anyone what to do about it: the per-field entry whose
 * path is the field just written, then the refusal's summary, and only then
 * the transport's own generic message.
 */
function describeRefusal(error: unknown, fieldName: string): string {
	if (error instanceof PayloadRequestError && error.detail !== undefined) {
		const fieldError = error.detail.fieldErrors.find(
			(entry) => entry.path === fieldName,
		);

		return fieldError?.message ?? error.detail.message;
	}

	return error instanceof Error ? error.message : "The change was refused.";
}

/**
 * builds a queue of single-field changes that have not reached the server yet,
 * so a field can be edited with no connection and still be saved once there is
 * one.
 *
 * a change for a field that already has one queued **replaces** it, so a field
 * edited repeatedly offline costs one request carrying the last value rather
 * than one per edit. the queue drains oldest-first under a mutex, so no two
 * changes are ever in flight at once and a change queued mid-drain cannot
 * overtake what is already being sent. queueing takes no lock at all — see
 * {@link enqueue} for why, and {@link forget} for what keeps that safe.
 *
 * a change the server refuses leaves the queue and is not retried; its message
 * lands in {@link PendingWriteState.refusals} for the row to show, and editing
 * the field again queues a fresh change. a change that never got a verdict at
 * all — the server was unreachable, or it turned the session's token away
 * before reading the value — stays queued for a later drain, and the drain stops
 * at it rather than working through a queue every member of which is about to
 * fail the same way.
 *
 * the two states have different lifetimes, which is the whole reason
 * {@link PendingWriteQueue.clearRefusals} exists. a queued change is owed to the
 * server and outlives any screen; a refusal describes what the user typed and
 * does not.
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

	/**
	 * takes a sent change out of the queue, and reports whether the entry it
	 * removed is the one that was actually sent.
	 *
	 * a change enqueued while this one was in flight replaced the entry under the
	 * same key — that is what makes an offline field edited twice cost one
	 * request — and deleting by key alone would throw that newer value away
	 * unsent. it is left where it is instead, and the loop sends it next.
	 */
	function forget(key: string, write: PendingWrite): boolean {
		if (writes.get(key) !== write) {
			return false;
		}

		writes.delete(key);

		return true;
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
					sent += 1;
					forget(key, write);
				} catch (error) {
					if (isWithoutVerdict(error)) {
						// left queued deliberately: nothing about the value was
						// rejected, so a later drain — the next connectivity change,
						// or the session's token being replaced — is what sends it.
						// stopping here matters as much as queueing does: whatever
						// turned this one away turns every change behind it away too,
						// so going on would spend one pointless request per queued
						// change. it also keeps the order intact.
						break;
					}

					refused += 1;
					// the field name is a schema identifier; the value the user typed
					// never reaches a log line or a breadcrumb.
					logger.warn("Refused a pending record-field write.", {
						slug: write.slug,
						fieldName: write.fieldName,
					});

					// a refusal describes the value that was sent. where a newer one
					// replaced it mid-flight the row is already showing that newer
					// value as unsent, so recording this message would put a refusal
					// under a change nobody has tried yet.
					if (forget(key, write)) {
						refusals.set(key, {
							target: toTarget(write),
							message: describeRefusal(error, write.fieldName),
							value: write.value,
						});
					}
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

	/**
	 * queues a change and publishes it, without waiting on anything — the caller
	 * is a blur handler, and the row it just left has to be marked unsent now
	 * rather than whenever the network next answers.
	 *
	 * it takes **no lock**, which is what makes that true. the drain holds the
	 * mutex across every `await send(…)`, so an enqueue asking for it would block
	 * for as long as the open request takes — up to the client's 15s timeout —
	 * and the row would show the typed value with no marker for all of it. the
	 * body below mutates synchronously, and JavaScript runs one thing at a time,
	 * so nothing can interleave with it however long the drain is parked. what
	 * the lock protected is instead handled where the danger actually is: see
	 * {@link forget}.
	 */
	function enqueue(write: PendingWrite): Promise<void> {
		const key = keyOf(write);

		writes.set(key, write);
		// the row is about to show the change as unsent, so whatever the last
		// attempt was refused for no longer describes it.
		refusals.delete(key);
		publish();
		// deliberately not awaited: the outcome arrives through the published
		// state above, which is what marks the row.
		startDrain();

		return Promise.resolve();
	}

	function clearRefusals(record: PendingWriteRecord): void {
		let cleared = false;

		for (const [key, refusal] of refusals) {
			if (
				refusal.target.slug === record.slug &&
				refusal.target.recordId === record.recordId
			) {
				refusals.delete(key);
				cleared = true;
			}
		}

		if (cleared) {
			publish();
		}
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
		clearRefusals,
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
