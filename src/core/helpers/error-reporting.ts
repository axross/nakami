import * as Sentry from "@sentry/react-native";
import { env } from "~/core/helpers/env";

/**
 * initializes the Sentry error reporter. must be called once, before the root
 * component renders. a missing DSN (CI, a machine that opts out via
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
 * reports a handled error to the error tracker. use at catch sites that
 * swallow errors the user never sees; unhandled errors are captured globally.
 * optional context is forwarded as Sentry extras — identifiers and metadata
 * only, never secrets or raw content.
 */
export function reportError(
	error: unknown,
	context?: { extra?: Record<string, unknown> },
): void {
	Sentry.captureException(error, context);
}

/** severity levels a breadcrumb may carry, mirroring the logger's levels. */
export type BreadcrumbLevel = "debug" | "info" | "warning" | "error";

/**
 * records a breadcrumb on the error tracker's timeline. breadcrumbs are the
 * trail of recent activity attached to the next captured exception, so a
 * reported error arrives with the events that led up to it. the structured
 * logger mirrors every log line through here automatically, so app code should
 * rarely call this directly — log instead. like log context, breadcrumb data
 * must carry identifiers and metadata only, never secrets or raw content.
 */
export function addBreadcrumb(breadcrumb: {
	message: string;
	category?: string;
	level?: BreadcrumbLevel;
	data?: Record<string, unknown>;
}): void {
	Sentry.addBreadcrumb(breadcrumb);
}

/**
 * wraps the root component with the error reporter's instrumentation
 * (touch tracking, profiling, error boundary).
 */
export const wrapRootComponent = Sentry.wrap;
