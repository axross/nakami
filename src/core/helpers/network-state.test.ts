import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import * as Network from "expo-network";
import { createModuleLogger } from "~/core/helpers/logging";
import { subscribeToNetworkState } from "./network-state";

// the global expo-network stub (see jest.config.cjs) reports an inert listener,
// which is right for every suite that only happens to reach the query client.
// this one is about the reading itself, so it drives both calls by hand.
jest.mock("expo-network", () => ({
	addNetworkStateListener: jest.fn(),
	getNetworkStateAsync: jest.fn(),
}));

jest.mock("~/core/helpers/logging", () => {
	const moduleLogger = {
		debug: jest.fn(),
		info: jest.fn(),
		warn: jest.fn(),
		error: jest.fn(),
	};

	return { createModuleLogger: () => moduleLogger };
});

// the mocked factory hands back one shared logger, so this is the same object a
// subscriber writes through.
const logger = jest.mocked(createModuleLogger("core/network-state"));

const SUBJECT = "the launch-time network state";

type NetworkStateListener = (state: { isConnected?: boolean }) => void;

function mockNetwork(currentState: { isConnected?: boolean }) {
	const remove = jest.fn();
	const listeners: NetworkStateListener[] = [];

	jest
		.mocked(Network.addNetworkStateListener)
		.mockImplementation((listener: unknown) => {
			listeners.push(listener as NetworkStateListener);

			return { remove } as unknown as ReturnType<
				typeof Network.addNetworkStateListener
			>;
		});
	jest
		.mocked(Network.getNetworkStateAsync)
		.mockResolvedValue(
			currentState as Awaited<ReturnType<typeof Network.getNetworkStateAsync>>,
		);

	return { remove, listeners };
}

function subscribe(onChange: (isConnected: boolean) => void) {
	return subscribeToNetworkState(onChange, { logger, subject: SUBJECT });
}

beforeEach(() => {
	jest.clearAllMocks();
});

describe("subscribeToNetworkState()", () => {
	it("reports the connection the subscription started on", async () => {
		mockNetwork({ isConnected: false });
		const onChange = jest.fn();

		subscribe(onChange);
		await Promise.resolve();

		expect(onChange).toHaveBeenCalledWith(false);
	});

	it("reports every change the device makes", () => {
		const { listeners } = mockNetwork({ isConnected: true });
		const onChange = jest.fn();

		subscribe(onChange);
		listeners[0]?.({ isConnected: false });
		listeners[0]?.({ isConnected: true });

		expect(onChange.mock.calls).toEqual([[false], [true]]);
	});

	// the seed resolves a tick late, so a change that already arrived describes
	// the connection better than the state the read started with.
	it("does not let a late seed overturn a change that already arrived", async () => {
		const { listeners } = mockNetwork({ isConnected: true });
		const onChange = jest.fn();

		subscribe(onChange);
		listeners[0]?.({ isConnected: false });
		await Promise.resolve();
		await Promise.resolve();

		expect(onChange.mock.calls).toEqual([[false]]);
	});

	it("stops listening once unsubscribed", () => {
		const { remove } = mockNetwork({ isConnected: true });

		subscribe(jest.fn())();

		expect(remove).toHaveBeenCalledTimes(1);
	});

	it("survives a failed reading, leaving the caller its own default", async () => {
		mockNetwork({ isConnected: true });
		jest
			.mocked(Network.getNetworkStateAsync)
			.mockRejectedValue(new Error("no permission"));
		const onChange = jest.fn();

		subscribe(onChange);
		await Promise.resolve();
		await Promise.resolve();

		expect(onChange).not.toHaveBeenCalled();
	});

	// two subscribers share this reading, so a line has to say which read it is
	// describing — and the bracket has to close on the failure path as much as on
	// the one that worked.
	it("brackets the reading with the subject it was given", async () => {
		mockNetwork({ isConnected: true });

		subscribe(jest.fn());
		await Promise.resolve();
		await Promise.resolve();

		expect(logger.debug).toHaveBeenCalledWith(`Started reading ${SUBJECT}.`);
		expect(logger.debug).toHaveBeenCalledWith(
			`Completed reading ${SUBJECT}.`,
			expect.objectContaining({ isConnected: true, superseded: false }),
		);
	});

	it("closes the bracket at warn when the reading failed", async () => {
		mockNetwork({ isConnected: true });
		jest
			.mocked(Network.getNetworkStateAsync)
			.mockRejectedValue(new Error("no permission"));

		subscribe(jest.fn());
		await Promise.resolve();
		await Promise.resolve();

		expect(logger.warn).toHaveBeenCalledWith(
			`Failed reading ${SUBJECT}.`,
			expect.objectContaining({ reason: "no permission" }),
		);
	});
});
