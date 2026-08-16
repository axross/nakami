import { QueryCache, QueryClient } from "@tanstack/react-query";
import { PayloadRequestError } from "~/common/helpers/payload-client";
import { reportError } from "~/core/helpers/error-reporting";

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

export const queryClient = new QueryClient({
	// report unexpected query failures to the error tracker once they settle
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
