module.exports = {
	preset: "jest-expo",
	testMatch: ["<rootDir>/src/**/*.test.{ts,tsx}"],
	moduleNameMapper: {
		"^~/(.*)$": "<rootDir>/src/$1",
	},
	transformIgnorePatterns: [
		"node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|react-native-unistyles|react-native-nitro-modules|react-native-edge-to-edge|react-native-logs))",
	],
};
