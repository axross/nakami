import {
	focusManager,
	onlineManager,
	QueryCache,
	QueryClient,
} from "@tanstack/react-query";
import * as Network from "expo-network";
import { AppState, Platform } from "react-native";
import { PayloadRequestError } from "~/common/helpers/payload-client";
import { reportError } from "~/core/helpers/error-reporting";
import { createModuleLogger } from "~/core/helpers/logging";

const logger = createModuleLogger("core/query-client");

/**
 * Whether a failed query is worth reporting to the error tracker. Permission
 * (`auth`) and connectivity (`network`) failures are expected operational
 * states the UI already surfaces to the user, so they are not reported;
 * everything else — an unexpected server response, a payload the app can't
 * parse — is a real problem worth capturing.
 */
export function isReportableQueryError(error: unknown): boolean {
	return !(
		error instanceof PayloadRequestError &&
		(error.kind === "auth" || error.kind === "network")
	);
}

export const queryClient = new QueryClient({
	// Report unexpected query failures to the error tracker once they settle
	// (after retries); the per-feature UI still renders its own error state.
	queryCache: new QueryCache({
		onError: (error, query) => {
			if (isReportableQueryError(error)) {
				reportError(error, { extra: { queryKey: query.queryKey[0] } });
			}
		},
	}),
	defaultOptions: {
		queries: {
			retry: 2,
			staleTime: 30_000,
		},
	},
});

// TanStack Query learns about connectivity and foreground state from two
// process-wide managers. In a browser they wire themselves to `online`/
// `offline` and `visibilitychange`; React Native fires none of those, so the
// `refetchOnReconnect` and `refetchOnWindowFocus` defaults above — both `true`
// — stay silently inert until the managers are given a native source. Both are
// registered here at module scope rather than from a component, because they
// are global: tying one to a component would unregister it on unmount.

onlineManager.setEventListener((setOnline) => {
	let hasObservedChange = false;

	const subscription = Network.addNetworkStateListener((state) => {
		hasObservedChange = true;
		setOnline(Boolean(state.isConnected));
	});

	// The listener only reports *changes*, so nothing yet describes the
	// connection the app launched with — a launch while offline would otherwise
	// keep the manager's optimistic `true`. Seed it once, unless a real change
	// has already arrived and superseded it.
	const startedAt = performance.now();

	logger.debug("Started reading the launch-time network state.");

	Network.getNetworkStateAsync()
		.then((state) => {
			const isConnected = Boolean(state.isConnected);

			if (!hasObservedChange) {
				setOnline(isConnected);
			}

			logger.debug("Completed reading the launch-time network state.", {
				isConnected,
				superseded: hasObservedChange,
				duration: performance.now() - startedAt,
			});
		})
		.catch((error: unknown) => {
			// Recovered rather than reported, for the same reason a `network`
			// request failure is not reported above: connectivity is an expected
			// operational state, and the manager's own optimistic `true` is the
			// fallback, which the next change event corrects. The bracket still
			// closes on this path, so the breadcrumb trail does not go quiet on
			// the failure the trail is most likely to be read for.
			logger.warn("Failed reading the launch-time network state.", {
				reason: error instanceof Error ? error.message : "unknown",
				duration: performance.now() - startedAt,
			});
		});

	return () => subscription.remove();
});

// Native only. `setEventListener` *replaces* whatever source the manager
// installs for itself, so registering this on web would trade the browser's
// working `visibilitychange` wiring for an `AppState` bridge — and the guard
// that keeps AppState from double-driving focus there would leave the manager
// with no source at all.
if (Platform.OS !== "web") {
	focusManager.setEventListener((handleFocus) => {
		const subscription = AppState.addEventListener("change", (status) => {
			handleFocus(status === "active");
		});

		return () => subscription.remove();
	});
}
