// Extends Expo's Metro defaults with react-native-svg-transformer so `.svg`
// files import as React components (via react-native-svg) instead of as static
// assets. `.svg` is moved out of `assetExts` into `sourceExts` and routed
// through the transformer's babel transformer.
const { getDefaultConfig } = require("expo/metro-config");

module.exports = (() => {
	const config = getDefaultConfig(__dirname);
	const { transformer, resolver } = config;

	config.transformer = {
		...transformer,
		babelTransformerPath: require.resolve("react-native-svg-transformer/expo"),
	};
	config.resolver = {
		...resolver,
		assetExts: resolver.assetExts.filter((ext) => ext !== "svg"),
		sourceExts: [...resolver.sourceExts, "svg"],
	};

	return config;
})();
