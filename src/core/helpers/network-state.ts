import * as Network from "expo-network";
import type { createModuleLogger } from "~/core/helpers/logging";

/** the module logger a subscriber writes its bracket lines through. */
type ModuleLogger = ReturnType<typeof createModuleLogger>;

/** who is reading the network state, for the lines the read writes. */
export interface NetworkStateReadOptions {
	readonly logger: ModuleLogger;
	/**
	 * what the read is of, as the bracket lines name it — "the launch-time
	 * network state", "the current network state". it is written into the message
	 * rather than into the context object so the trail reads as a sentence and
	 * one subscriber's bracket cannot be mistaken for another's. the only values
	 * are the call sites' own literals, so nothing here is unbounded.
	 */
	readonly subject: string;
}

/**
 * subscribes to the device's connectivity, reporting it on subscription as well
 * as on every change, and returns the unsubscribe.
 *
 * `expo-network`'s listener reports **changes only**, so nothing it emits
 * describes the connection the subscription started on — a start while offline
 * would leave the caller sitting on whatever it optimistically assumed. the
 * current state is therefore read once alongside the listener and reported,
 * unless a real change has already arrived and superseded it: that read resolves
 * a tick late, and a change that landed in the meantime describes the connection
 * better than the state the read began with.
 *
 * a failed read is recovered rather than reported. connectivity is an expected
 * operational state, the caller's own default stands, and the next change event
 * corrects it. the bracket still closes on that path, so the breadcrumb trail
 * does not go quiet on the failure it is most likely to be read for.
 *
 * two subscribers want exactly this and cannot share one: `onlineManager`'s
 * event listener, which is what makes TanStack Query's `refetchOnReconnect`
 * work at all on React Native, and the pending-write queue's own trigger, which
 * reads the device directly rather than through that manager so that it does not
 * depend on the query layer being mounted. they share this reading instead, and
 * keep their own loggers — a line has to say which of them wrote it.
 */
export function subscribeToNetworkState(
	onChange: (isConnected: boolean) => void,
	{ logger, subject }: NetworkStateReadOptions,
): () => void {
	let hasObservedChange = false;

	const subscription = Network.addNetworkStateListener((state) => {
		hasObservedChange = true;
		onChange(Boolean(state.isConnected));
	});

	const startedAt = performance.now();

	logger.debug(`Started reading ${subject}.`);

	Network.getNetworkStateAsync()
		.then((state) => {
			const isConnected = Boolean(state.isConnected);

			if (!hasObservedChange) {
				onChange(isConnected);
			}

			logger.debug(`Completed reading ${subject}.`, {
				isConnected,
				superseded: hasObservedChange,
				duration: performance.now() - startedAt,
			});
		})
		.catch((error: unknown) => {
			logger.warn(`Failed reading ${subject}.`, {
				reason: error instanceof Error ? error.message : "unknown",
				duration: performance.now() - startedAt,
			});
		});

	return () => subscription.remove();
}
