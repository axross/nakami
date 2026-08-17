import { jest } from "@jest/globals";

// manual mock for the Sentry error-reporting wrapper. a test opts in with
// `jest.mock("~/core/helpers/error-reporting")` (no factory needed) and gets
// inert jest.fn()s, so the logger's breadcrumb transport and any catch-site
// reporting can be asserted without touching a real Sentry client.
export const initializeErrorReporter = jest.fn();
export const reportError = jest.fn();
export const addBreadcrumb = jest.fn();
export const wrapRootComponent = jest.fn((component: unknown) => component);
