import type { ConnectivitySource } from "~/collections/helpers/pending-write-queue";
import { createModuleLogger } from "~/core/helpers/logging";
import { subscribeToNetworkState } from "~/core/helpers/network-state";

const logger = createModuleLogger("collections/network-connectivity");

/**
 * the device's own connectivity, as a
 * {@link import("~/collections/helpers/pending-write-queue").ConnectivitySource}
 * — the same `expo-network` reading the query client drives `onlineManager`
 * from, taken per subscriber here rather than through that manager, so the
 * queue's own trigger does not depend on the query layer being mounted.
 *
 * only the adapter is this feature's: the reading itself, and the seeding and
 * failure handling that make it usable, are
 * {@link subscribeToNetworkState}'s. the logger stays this module's, so a line
 * says which of the two subscribers wrote it.
 */
export function createNetworkConnectivity(): ConnectivitySource {
	return {
		subscribe(onChange) {
			return subscribeToNetworkState(onChange, {
				logger,
				subject: "the current network state",
			});
		},
	};
}
