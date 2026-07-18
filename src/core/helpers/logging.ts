import { consoleTransport, logger } from "react-native-logs";

const rootLogger = logger.createLogger({
	severity: __DEV__ ? "debug" : "info",
	transport: consoleTransport,
	transportOptions: {
		colors: {
			info: "blueBright",
			warn: "yellowBright",
			error: "redBright",
		},
	},
});

/**
 * Returns a child logger labeled with the owning module, e.g.
 * `createModuleLogger("feeds/queries")`. Prefer one child logger per module
 * over the root logger so log lines are attributable.
 */
export function createModuleLogger(moduleName: string) {
	return rootLogger.extend(moduleName);
}
