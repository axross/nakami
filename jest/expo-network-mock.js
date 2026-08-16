// Jest mock for expo-network, wired in via jest.config.cjs's moduleNameMapper.
//
// `src/core/helpers/query-client.ts` registers TanStack Query's `onlineManager`
// at MODULE SCOPE, so the registration runs in every suite that reaches the
// shared query client — which is every screen suite, not just the one testing
// the registration. Under jest-expo the real module has no native side, so
// `addNetworkStateListener` returns `undefined` and the manager's cleanup then
// throws `subscription.remove is not a function` the moment a
// `QueryClientProvider` unmounts. That failure has nothing to do with the suite
// that hits it, which is exactly why the stub is global rather than per-file.
//
// A suite that specifically exercises the registration replaces this module
// wholesale with its own `jest.mock` factory (`query-client.test.ts` does), so
// nothing here constrains what that suite can assert.

/**
 * No device changes connectivity on its own in a suite, so the listener is
 * inert. It still returns a real subscription, which is the whole point.
 */
function addNetworkStateListener() {
	return { remove: () => {} };
}

/**
 * Mirrors whatever `onlineManager` currently holds rather than claiming a fixed
 * answer. The registration seeds the manager from this probe, and a fixed
 * `true` would silently overturn the offline state a suite had just declared
 * with `onlineManager.setOnline(false)` — the seed would land a tick later and
 * un-pause the query the suite was testing. Reporting the manager's own state
 * makes the seed a no-op under test, which is correct: in a suite the manager
 * *is* the connectivity the test declared.
 */
async function getNetworkStateAsync() {
	// Required lazily: this module is resolved the moment `query-client.ts`
	// imports expo-network, and a module-scope require here would join that
	// import cycle.
	const { onlineManager } = require("@tanstack/react-query");

	return { isConnected: onlineManager.isOnline() };
}

module.exports = {
	__esModule: true,
	addNetworkStateListener,
	getNetworkStateAsync,
};
