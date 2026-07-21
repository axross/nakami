import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { addBreadcrumb } from "~/core/helpers/error-reporting";
import { createModuleLogger } from "./logging";

jest.mock("~/core/helpers/error-reporting");

beforeEach(() => {
	jest.clearAllMocks();
});

describe("createModuleLogger breadcrumb transport", () => {
	it("records an info log as an info breadcrumb tagged with the module and context", () => {
		const logger = createModuleLogger("test/info-module");

		logger.info("Completed signing in.", { serverUrl: "https://cms.test" });

		expect(addBreadcrumb).toHaveBeenCalledWith({
			message: "Completed signing in.",
			category: "test/info-module",
			level: "info",
			data: { serverUrl: "https://cms.test" },
		});
	});

	it("maps `warn` to the error tracker's `warning` level", () => {
		const logger = createModuleLogger("test/warn-module");

		logger.warn("Token refresh deferred.", { reason: "network" });

		expect(addBreadcrumb).toHaveBeenCalledWith({
			message: "Token refresh deferred.",
			category: "test/warn-module",
			level: "warning",
			data: { reason: "network" },
		});
	});

	it("records a debug log as a debug breadcrumb", () => {
		const logger = createModuleLogger("test/debug-module");

		logger.debug("Started request.", { operation: "login" });

		expect(addBreadcrumb).toHaveBeenCalledWith({
			message: "Started request.",
			category: "test/debug-module",
			level: "debug",
			data: { operation: "login" },
		});
	});

	it("omits `data` when the log call carries no context object", () => {
		const logger = createModuleLogger("test/no-context");

		logger.info("Started session hydration.");

		expect(addBreadcrumb).toHaveBeenCalledWith({
			message: "Started session hydration.",
			category: "test/no-context",
			level: "info",
			data: undefined,
		});
	});
});
