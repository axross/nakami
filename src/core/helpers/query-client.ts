import {
	type DefaultError,
	focusManager,
	onlineManager,
	type Query,
	QueryCache,
	QueryClient,
} from "@tanstack/react-query";
import { AppState, Platform } from "react-native";
import { PayloadRequestError } from "~/common/helpers/payload-client";
import { describeQueryKey } from "~/common/helpers/session-query-key";
import { reportError } from "~/core/helpers/error-reporting";
import { createModuleLogger } from "~/core/helpers/logging";
import { subscribeToNetworkState } from "~/core/helpers/network-state";

const logger = createModuleLogger("core/query-client");

/**
 * whether a failed query is worth reporting to the error tracker. permission
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

/**
 * reports a settled query failure to the error tracker, unless
 * {@link isReportableQueryError} rules it out. the failing key is described
 * rather than passed through, so the report names the resource that failed and
 * carries no user id.
 *
 * this is the query cache's own `onError`, and its parameters match that
 * callback's so the cache below can be given this function itself. naming it
 * here rather than writing it inline is what lets a test assert what a failure
 * reports without constructing or driving a `QueryClient`.
 */
export function reportQueryFailure(
	error: DefaultError,
	query: Query<unknown, unknown, unknown>,
): void {
	if (!isReportableQueryError(error)) {
		return;
	}

	reportError(error, { extra: { queryKey: describeQueryKey(query.queryKey) } });
}

export const queryClient = new QueryClient({
	// report unexpected query failures to the error tracker once they settle
	// (after retries); the per-feature UI still renders its own error state.
	queryCache: new QueryCache({ onError: reportQueryFailure }),
	defaultOptions: {
		queries: {
			retry: 2,
			staleTime: 30_000,
		},
	},
});

// TanStack Query learns about connectivity and foreground state from two
// process-wide managers. in a browser they wire themselves to `online`/
// `offline` and `visibilitychange`; React Native fires none of those, so the
// `refetchOnReconnect` and `refetchOnWindowFocus` defaults above — both `true`
// — stay silently inert until the managers are given a native source. both are
// registered here at module scope rather than from a component, because they
// are global: tying one to a component would unregister it on unmount.

// the manager's own optimistic `true` is what stands until the reading below
// says otherwise, and a launch while offline is exactly the case the seeded
// read exists for — see {@link subscribeToNetworkState}, which the pending-write
// queue's own trigger shares.
onlineManager.setEventListener((setOnline) =>
	subscribeToNetworkState(setOnline, {
		logger,
		subject: "the launch-time network state",
	}),
);

// native only. `setEventListener` *replaces* whatever source the manager
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
