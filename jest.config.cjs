module.exports = {
	preset: "jest-expo",
	testMatch: ["<rootDir>/src/**/*.test.{ts,tsx}"],
	moduleNameMapper: {
		"^~/assets/(.*)$": "<rootDir>/assets/$1",
		"^~/(.*)$": "<rootDir>/src/$1",
		// react-native-reanimated v4's own jest mock (`react-native-reanimated/
		// mock`) is broken — it requires an absent `./src/mock` — so expo-router's
		// testing-library `jest.mock` catches the throw and falls back to an empty
		// module, dropping hooks like useReducedMotion. Redirect that `/mock`
		// subpath to a complete manual mock; expo-router's factory then loads it
		// and re-exports it as the reanimated module. Map ONLY `/mock`, not the
		// bare specifier: a bare mapper conflicts with expo-router's own
		// `jest.mock` of react-native-reanimated and recurses through the `/mock`
		// require, overflowing the stack.
		"^react-native-reanimated/mock$": "<rootDir>/jest/reanimated-mock.js",
		// lucide-react-native's `react-native` entry is ESM (`dist/esm/*.mjs`) that
		// jest-expo's transform does not process, so importing an icon throws
		// `SyntaxError: Unexpected token 'export'`. Map the module to a stub that
		// renders every icon as a no-op component (see that file) rather than
		// widening the transformIgnorePatterns the note below keeps untouched.
		"^lucide-react-native$": "<rootDir>/jest/lucide-react-native-mock.js",
	},
	// jest-expo's default transformIgnorePatterns already allows every
	// react-native-* / expo-* / @expo/* package through Babel — do not override
	// it here; a narrower hand-rolled list breaks on untranspiled ESM.
	//
	// @testing-library/react-native is pinned to v13 (with react-test-renderer
	// matching react's exact version): expo-router 57's renderRouter calls
	// RNTL's render synchronously, and v14 made render async. Do not bump RNTL
	// to v14 until expo-router's testing library supports it.
	setupFiles: ["react-native-unistyles/mocks", "<rootDir>/src/unistyles.ts"],
};
