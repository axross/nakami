// Registered as jest.config.cjs's setupFilesAfterEnv module. Jest injects its
// API (`describe`, `it`, `expect`, `jest`, …) onto the global object, so a test
// file that imports only part of that API from `@jest/globals` still runs green
// — the symbols it forgot resolve off the global instead, and nothing reports
// the inconsistency. Deleting the injected globals here turns that into a
// `ReferenceError` naming the symbol and the line, so the convention is
// enforced when the suite runs and not only by `npm run typecheck`.
//
// `injectGlobals: false` is Jest's own option for this and cannot be used on
// this stack: `@react-native/jest-preset/jest/setup.js` and
// `jest-expo/src/preset/setup.js` both call the injected `jest` global, a
// preset's `setupFiles` always run before the project's, and setting the option
// fails every suite at load with `ReferenceError: jest is not defined`.
// `setupFilesAfterEnv` runs after those preset files and before the test file
// is required, which is the one window where the globals can be taken away
// without breaking anything that legitimately needed them.

// These two requires MUST stay ahead of the deletion below. Both libraries
// touch the injected globals at module scope, and a test file would otherwise
// load them after the globals are gone:
//
//   - @testing-library/react-native calls `expect.extend(...)` to register its
//     matchers, and registers its auto-cleanup and the React `act` environment
//     behind `typeof afterEach === "function"` / `typeof beforeAll ===
//     "function"` guards. Those guards fail *silently*, so a green suite alone
//     would not reveal them having been skipped — the render- and router-using
//     suites are what actually exercise this ordering.
//   - expo-router/testing-library calls `jest.mock(...)` at module scope for
//     expo-linking and react-native-reanimated, and registers its own matchers
//     with `expect.extend(...)`.
//
// Any future library that reads an injected global at module scope, or any
// setup module added to setupFilesAfterEnv after this one, has to be loaded
// here too — above the deletion — for the same reason.
require("@testing-library/react-native");
require("expo-router/testing-library");

// The list is read from @jest/globals at run time rather than hard-coded, so it
// cannot drift from what Jest actually injects. Deleting matches
// `injectGlobals: false` semantics, where the global is simply absent; a
// throwing getter would give a friendlier message but would also break the
// legitimate `typeof` feature detection that libraries like the one above rely
// on.
for (const name of Object.keys(require("@jest/globals"))) {
	delete globalThis[name];
}
