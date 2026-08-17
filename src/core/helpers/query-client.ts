import {
	type DefaultError,
	type Query,
	QueryCache,
	QueryClient,
} from "@tanstack/react-query";
import { PayloadRequestError } from "~/common/helpers/payload-client";
import { describeQueryKey } from "~/common/helpers/session-query-key";
import { reportError } from "~/core/helpers/error-reporting";

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

/**
 * Reports a settled query failure to the error tracker, unless
 * {@link isReportableQueryError} rules it out. The failing key is described
 * rather than passed through, so the report names the resource that failed and
 * carries no user id.
 *
 * This is the query cache's own `onError`, and its parameters match that
 * callback's so the cache below can be given this function itself. Naming it
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
	// Report unexpected query failures to the error tracker once they settle
	// (after retries); the per-feature UI still renders its own error state.
	queryCache: new QueryCache({ onError: reportQueryFailure }),
	defaultOptions: {
		queries: {
			retry: 2,
			staleTime: 30_000,
		},
	},
});
