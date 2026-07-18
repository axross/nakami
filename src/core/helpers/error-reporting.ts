import * as Sentry from "@sentry/react-native";
import { env } from "~/core/helpers/env";

/**
 * Initializes the Sentry error reporter. Must be called once, before the root
 * component renders. A missing DSN (CI, a machine that opts out via
 * .env.local) leaves reporting disabled without failing the app, and dev
 * builds never send events — flip `enabled` temporarily to test the
 * integration locally.
 */
export function initializeErrorReporter(): void {
	if (env.EXPO_PUBLIC_SENTRY_DSN === undefined) {
		return;
	}

	Sentry.init({
		dsn: env.EXPO_PUBLIC_SENTRY_DSN,
		enabled: !__DEV__,
		environment: __DEV__ ? "development" : "production",
		sendDefaultPii: false,
	});
}

/**
 * Reports a handled error to the error tracker. Use at catch sites that
 * swallow errors the user never sees; unhandled errors are captured globally.
 */
export function reportError(error: unknown): void {
	Sentry.captureException(error);
}

/**
 * Wraps the root component with the error reporter's instrumentation
 * (touch tracking, profiling, error boundary).
 */
export const wrapRootComponent = Sentry.wrap;
