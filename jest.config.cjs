module.exports = {
	preset: "jest-expo",
	testMatch: ["<rootDir>/src/**/*.test.{ts,tsx}"],
	moduleNameMapper: {
		"^~/assets/(.*)$": "<rootDir>/assets/$1",
		"^~/(.*)$": "<rootDir>/src/$1",
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
