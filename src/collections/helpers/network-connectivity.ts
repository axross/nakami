import * as Network from "expo-network";
import type { ConnectivitySource } from "~/collections/helpers/pending-write-queue";
import { createModuleLogger } from "~/core/helpers/logging";

const logger = createModuleLogger("collections/network-connectivity");

/**
 * the device's own connectivity, as a
 * {@link import("~/collections/helpers/pending-write-queue").ConnectivitySource}
 * — the same `expo-network` the query client drives `onlineManager` from, read
 * per subscriber here rather than through that manager, so the queue's own
 * trigger does not depend on the query layer being mounted.
 */
export function createNetworkConnectivity(): ConnectivitySource {
	return {
		subscribe(onChange) {
			let hasObservedChange = false;

			const subscription = Network.addNetworkStateListener((state) => {
				hasObservedChange = true;
				onChange(Boolean(state.isConnected));
			});

			// the listener reports changes only, so nothing yet describes the
			// connection the subscription started on. seed it once, unless a real
			// change has already arrived and superseded it.
			const startedAt = performance.now();

			logger.debug("Started reading the current network state.");

			Network.getNetworkStateAsync()
				.then((state) => {
					const isConnected = Boolean(state.isConnected);

					if (!hasObservedChange) {
						onChange(isConnected);
					}

					logger.debug("Completed reading the current network state.", {
						isConnected,
						superseded: hasObservedChange,
						duration: performance.now() - startedAt,
					});
				})
				.catch((error: unknown) => {
					// recovered rather than reported: connectivity is an expected
					// operational state, the queue's optimistic default stands, and a
					// send that turns out to be offline leaves its change queued.
					logger.warn("Failed reading the current network state.", {
						reason: error instanceof Error ? error.message : "unknown",
						duration: performance.now() - startedAt,
					});
				});

			return () => subscription.remove();
		},
	};
}
