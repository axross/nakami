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
	setupFiles: ["react-native-unistyles/mocks", "<rootDir>/src/unistyles.ts"],
};
