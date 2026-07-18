module.exports = (api) => {
	api.cache(true);

	return {
		presets: ["babel-preset-expo"],
		plugins: [
			// used in 📦 drizzle-orm (bundling generated .sql migrations)
			["inline-import", { extensions: [".sql"] }],
			["react-native-unistyles/plugin", { root: "src" }],
		],
	};
};
