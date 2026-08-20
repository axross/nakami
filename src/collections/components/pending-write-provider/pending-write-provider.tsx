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

const PendingWriteContext = createContext<PendingWriteQueue | null>(null);

async function sendRecordFieldWrite(write: PendingWrite): Promise<void> {
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
}

/**
 * builds the queue this app actually runs: single-field writes against the
 * signed-in Payload server, triggered by the device's own connectivity.
 */
export function createRecordFieldWriteQueue(): PendingWriteQueue {
	return createPendingWriteQueue({
		send: sendRecordFieldWrite,
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
 */
export function PendingWriteProvider({
	children,
	queue,
}: Readonly<PendingWriteProviderProps>): JSX.Element {
	const [createdQueue] = useState<PendingWriteQueue>(
		() => queue ?? createRecordFieldWriteQueue(),
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
