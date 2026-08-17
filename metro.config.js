// builds the Metro config from the Sentry SDK's factory rather than Expo's own.
// getSentryExpoConfig wraps Expo's defaults and prepends the runtime Debug ID
// module, which is what lets the SDK stamp a Debug ID onto the events it sends
// so Sentry can match them to the uploaded source map. reverting this to
// `getDefaultConfig` from expo/metro-config breaks that matching without
// failing the build. Expo's own serializer still stamps a `debugId` into the
// emitted source map either way, so an intact map `debugId` is not evidence
// that the Sentry wiring survived — the bundle-side module is.
//
// the customization below extends those defaults with
// react-native-svg-transformer so `.svg` files import as React components (via
// react-native-svg) instead of as static assets. `.svg` is moved out of
// `assetExts` into `sourceExts` and routed through the transformer's babel
// transformer. it has to stay layered after the factory call, so that its
// `babelTransformerPath` override lands last.
const { getSentryExpoConfig } = require("@sentry/react-native/metro");

module.exports = (() => {
	const config = getSentryExpoConfig(__dirname);
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
