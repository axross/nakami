import { type QueryClient, useQueryClient } from "@tanstack/react-query";
import {
	createContext,
	type JSX,
	type ReactNode,
	useContext,
	useEffect,
	useState,
	useSyncExternalStore,
} from "react";
import { useAuthStore } from "~/auth/stores/auth-store";
import { createNetworkConnectivity } from "~/collections/helpers/network-connectivity";
import {
	createPendingWriteQueue,
	type PendingWrite,
	type PendingWriteQueue,
	type PendingWriteState,
} from "~/collections/helpers/pending-write-queue";
import { updateRecordField } from "~/collections/helpers/update-record-field";
import { setCachedRecordField } from "~/collections/queries/collection-record-query";
import { createModuleLogger } from "~/core/helpers/logging";

const logger = createModuleLogger("collections/pending-write-provider");

const PendingWriteContext = createContext<PendingWriteQueue | null>(null);

async function sendRecordFieldWrite(
	queryClient: QueryClient,
	write: PendingWrite,
): Promise<void> {
	// the queue holds no hooks and outlives any one screen: read the session
	// imperatively, at the moment the change is actually sent.
	const session = useAuthStore.getState().session;

	if (session === null) {
		throw new Error("Cannot save a field without a session.");
	}

	await updateRecordField(
		session.serverUrl,
		session.token,
		write.slug,
		write.recordId,
		write.fieldName,
		write.value,
	);

	// the change has reached the server, so the cached record is now the stale
	// copy. only the saved field moves, and nothing is invalidated — see
	// `setCachedRecordField` for why a refetch is the one thing a per-field save
	// must not trigger. it runs here because the queue is the only thing that
	// sends: a change made offline reaches the server from a drain, long after
	// the blur that queued it returned.
	setCachedRecordField(
		queryClient,
		{
			userId: session.user.id,
			slug: write.slug,
			recordId: write.recordId,
		},
		write.fieldName,
		write.value,
	);
}

/**
 * builds the queue this app actually runs: single-field writes against the
 * signed-in Payload server, triggered by the device's own connectivity, each
 * landing in the record cache once it is accepted.
 */
export function createRecordFieldWriteQueue(
	queryClient: QueryClient,
): PendingWriteQueue {
	return createPendingWriteQueue({
		send: (write) => sendRecordFieldWrite(queryClient, write),
		connectivity: createNetworkConnectivity(),
	});
}

/** what the provider publishes, and the queue a test may hand it instead. */
export interface PendingWriteProviderProps {
	readonly children: ReactNode;
	/**
	 * the queue to publish. one built on this app's own transport is created and
	 * disposed by the provider when this is omitted; a queue handed in belongs to
	 * whoever built it and is left alone.
	 */
	readonly queue?: PendingWriteQueue;
}

/**
 * publishes one pending-write queue to everything beneath it. mounting it
 * inside the Collections stack is what scopes the queue to that stack's
 * lifetime, and what keeps every consumer reading the same instance without a
 * module-level singleton — which is also what lets a test mount its own.
 *
 * it also owns the queue's second drain trigger. connectivity is the queue's
 * own, injected at construction; the session's token changing is this
 * component's, because the queue reads the session imperatively through its
 * sender and stays free of the auth store — which is what keeps it a unit under
 * test.
 */
export function PendingWriteProvider({
	children,
	queue,
}: Readonly<PendingWriteProviderProps>): JSX.Element {
	const queryClient = useQueryClient();
	const [createdQueue] = useState<PendingWriteQueue>(
		() => queue ?? createRecordFieldWriteQueue(queryClient),
	);
	const value = queue ?? createdQueue;

	useEffect(() => {
		if (queue !== undefined) {
			return;
		}

		return () => {
			createdQueue.dispose();
		};
	}, [queue, createdQueue]);

	// a change the server turned away because the session's token had expired is
	// left queued rather than refused, and the token being replaced is the event
	// that makes it sendable again. nothing else would fire one: the queue's own
	// trigger is connectivity, and a token expires without the connection ever
	// dropping, so the change would sit until some unrelated network change
	// happened along.
	//
	// the store's own subscription rather than a selector hook, so the drain is
	// driven by the change itself instead of by a render, and so a token replaced
	// while this is mounted is the only thing it ever reacts to — zustand calls a
	// listener on change alone, never once on subscribing, so the token already
	// in place at mount fires nothing.
	useEffect(() => {
		return useAuthStore.subscribe((next, previous) => {
			const token = next.session?.token ?? null;

			// a token that is genuinely new and genuinely usable. every other store
			// change — a status flip, a `null` left by signing out, a user record
			// replaced by a refresh that kept the token — leaves the queue exactly
			// as unsendable as it already was, and draining on one would spend a
			// request per queued change to learn that.
			if (token === null || token === (previous.session?.token ?? null)) {
				return;
			}

			value.drain().catch((error: unknown) => {
				logger.warn("Failed draining pending record-field writes.", {
					trigger: "token-change",
					reason: error instanceof Error ? error.message : "unknown",
				});
			});
		});
	}, [value]);

	return (
		<PendingWriteContext.Provider value={value}>
			{children}
		</PendingWriteContext.Provider>
	);
}

/**
 * reads the queue the enclosing {@link PendingWriteProvider} published, for
 * queueing a change.
 */
export function usePendingWriteQueue(): PendingWriteQueue {
	const queue = useContext(PendingWriteContext);

	if (queue === null) {
		throw new Error(
			"usePendingWriteQueue() must be used within a <PendingWriteProvider> component.",
		);
	}

	return queue;
}

/**
 * subscribes to that queue's state, so a row re-renders when its change is sent
 * or refused.
 */
export function usePendingWriteState(): PendingWriteState {
	const queue = usePendingWriteQueue();

	return useSyncExternalStore(queue.subscribe, queue.getState);
}
