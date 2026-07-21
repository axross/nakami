# Testing Option Factories

Apply this reference when testing an option factory or a component that consumes one. General unit-test design — colocated files, behavior-focused assertions, fixture quality — stays owned by the project's unit-test guidelines; this reference owns only the TanStack-Query-specific mechanics.

## Consumer Tests: Real Client, Never a Mocked Hook

A component that calls `useQuery`/`useMutation` needs a real `QueryClient` in context. Give it one — a fresh, isolated client per test, provided through `QueryClientProvider` — and drive the test through the actual query/mutation, asserting the real result. Do **not** stub `useQuery`/`useMutation` or a `queryClient` method to inject state: the TanStack docs test through a real client, and mocking the query layer tests the mock instead of the component.

**Example:**

```ts
import { QueryClientProvider } from "@tanstack/react-query";
import { createTestQueryClient } from "~/common/helpers/test-query-client";

jest.mock("~/collections/helpers/payload-collections", () => ({
	fetchCollections: jest.fn(),
}));

it("renders the fetched collections", async () => {
	jest.mocked(fetchCollections).mockResolvedValue([{ slug: "posts" }]);
	const client = createTestQueryClient();

	const { getByText } = render(
		<QueryClientProvider client={client}>
			<CollectionList />
		</QueryClientProvider>,
	);

	await waitFor(() => expect(getByText("posts")).toBeTruthy());
});
```

**Guidelines:**

- MUST provide a real `QueryClient` through `QueryClientProvider` and let the component's `useQuery`/`useMutation` run; MUST NOT mock `useQuery`, `useMutation`, or a `queryClient` method (`getQueryData`, `invalidateQueries`, …) to inject `data`/`isPending`/`error`.
- MUST construct a fresh isolated client per test — via the shared `createTestQueryClient()` helper, which disables retries so a rejected query/mutation surfaces its error at once — never the app's `queryClient` singleton, so cache state cannot leak between tests.
- MUST mock the factory's data-layer/API dependency (the Drizzle query or Payload client call the `queryFn`/`mutationFn` invokes), not the query layer, and seed its fixture in `beforeEach`/`beforeAll` or at the top of the test.
- SHOULD assert the observable outcome the real query/mutation produces — rendered data, the pending label, the mapped error message, a follow-on call — with `waitFor`, since the flow resolves asynchronously.
- SHOULD, when a screen renders through `renderRouter`, wrap the route component in the provider inside the route map: `{ "sign-in": () => <QueryClientProvider client={client}><SignInScreen /></QueryClientProvider> }`.

## Factory Tests

An option factory is a plain function; assert on what it builds when the key structure or an input mapping carries risk.

**Guidelines:**

- SHOULD unit-test a factory directly by asserting its `queryKey`/`mutationKey` shape when the key derives from inputs non-trivially — it is the stable source of every invalidation target.
- SHOULD exercise the `queryFn`/`mutationFn` behavior through the consuming flow, or by invoking the returned option's function with the data-layer helper mocked, rather than duplicating the helper's own tests.
- MUST NOT assert a `queryFn` result that merely restates the mocked helper; test the factory's own contribution — key, input threading, store reads, side-effect calls — not the mock.
