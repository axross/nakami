# Testing Option Factories

Apply this reference when testing an option factory or a component that consumes one. General unit-test design — colocated files, behavior-focused assertions, fixture quality — stays owned by the project's unit-test guidelines; this reference owns only the TanStack-Query-specific mechanics.

## Consumer Tests: Provider or Mock

A component that calls `useQuery`/`useMutation` needs a `QueryClient` in context, or the hook stubbed. Pick by what the test asserts.

**Guidelines:**

- SHOULD mock `useQuery`/`useMutation` — spread `jest.requireActual` and override the one hook — when the test asserts how the component reacts to `data`/`isPending`/`error` state, so that state is injected directly and no client is needed.
- SHOULD render under a fresh-`QueryClient` `QueryClientProvider` wrapper (mocking the factory's data-layer/API helper instead) when the test asserts the real query/mutation flow end to end.
- MUST construct a new `QueryClient` per test when using a provider — never the app singleton — so cache state does not leak between tests.

**Example:**

```ts
jest.mock("@tanstack/react-query", () => ({
	...jest.requireActual<typeof import("@tanstack/react-query")>(
		"@tanstack/react-query",
	),
	useMutation: jest.fn(),
}));

jest.mocked(useMutation).mockReturnValue({
	mutate,
	isPending: false,
	error: null,
} as unknown as ReturnType<typeof useMutation>);
```

## Factory Tests

An option factory is a plain function; assert on what it builds when the key structure or an input mapping carries risk.

**Guidelines:**

- SHOULD unit-test a factory directly by asserting its `queryKey`/`mutationKey` shape when the key derives from inputs non-trivially — it is the stable source of every invalidation target.
- SHOULD exercise the `queryFn`/`mutationFn` behavior through the consuming flow, or by invoking the returned option's function with the data-layer helper mocked, rather than duplicating the helper's own tests.
- MUST NOT assert a `queryFn` result that merely restates the mocked helper; test the factory's own contribution — key, input threading, store reads, side-effect calls — not the mock.
