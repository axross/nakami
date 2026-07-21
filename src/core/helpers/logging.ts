import {
	type ConsoleTransportOptions,
	consoleTransport,
	logger,
	type transportFunctionType,
} from "react-native-logs";
import {
	addBreadcrumb,
	type BreadcrumbLevel,
} from "~/core/helpers/error-reporting";

// react-native-logs level text → error-tracker breadcrumb level.
const breadcrumbLevels: Record<string, BreadcrumbLevel> = {
	debug: "debug",
	info: "info",
	warn: "warning",
	error: "error",
};

/**
 * Prints `info`/`warn`/`error` to the console in every build and `debug` only
 * in development. The root logger runs at `debug` severity in every build so
 * that all levels reach the breadcrumb transport below; this transport, rather
 * than the logger's severity gate, is what keeps verbose `debug` lines out of
 * the production console — the severity gate would drop them before they could
 * become breadcrumbs.
 */
const consoleTransportWithDevDebug: transportFunctionType<
	ConsoleTransportOptions
> = (props) => {
	if (__DEV__ || props.level.text !== "debug") {
		consoleTransport(props);
	}
};

/**
 * Mirrors every log line onto the error tracker's breadcrumb trail, so a later
 * captured exception arrives with the lines that led up to it. The message is
 * the first log argument; the trailing context object (if any) rides along as
 * breadcrumb `data` and inherits the logging rule that keeps secrets and PII
 * out of that object.
 */
const breadcrumbTransport: transportFunctionType<object> = ({
	rawMsg,
	level,
	extension,
}) => {
	const [message, context] = Array.isArray(rawMsg) ? rawMsg : [rawMsg];

	addBreadcrumb({
		message: typeof message === "string" ? message : String(message),
		category: extension ?? undefined,
		level: breadcrumbLevels[level.text] ?? "info",
		data:
			context !== null && typeof context === "object"
				? (context as Record<string, unknown>)
				: undefined,
	});
};

const rootLogger = logger.createLogger({
	// Always `debug` so every level reaches the transports; the console
	// transport, not the severity gate, is what silences verbose output in
	// production, preserving debug lines as breadcrumbs.
	severity: "debug",
	transport: [consoleTransportWithDevDebug, breadcrumbTransport],
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
