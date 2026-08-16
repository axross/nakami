import { QueryClient } from "@tanstack/react-query";

/**
 * A fresh {@link QueryClient} for a single test. Retries are disabled so a
 * rejected query/mutation surfaces its error immediately instead of retrying,
 * and each test gets its own client so cache state never leaks between tests.
 * Provide it through a `QueryClientProvider` and assert the real result — never
 * mock `useQuery`/`useMutation` or a `queryClient` method.
 */
export function createTestQueryClient(): QueryClient {
	return new QueryClient({
		defaultOptions: {
			queries: { retry: false },
			mutations: { retry: false },
		},
	});
}
