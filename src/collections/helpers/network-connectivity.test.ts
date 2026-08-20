import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import * as Network from "expo-network";
import { createNetworkConnectivity } from "./network-connectivity";

// the global expo-network stub (see jest.config.cjs) reports an inert listener,
// which is right for every suite that only happens to reach the query client.
// this one is about the reading itself, so it drives both calls by hand.
jest.mock("expo-network", () => ({
	addNetworkStateListener: jest.fn(),
	getNetworkStateAsync: jest.fn(),
}));

type NetworkStateListener = (state: { isConnected?: boolean }) => void;

function mockNetwork(launchState: { isConnected?: boolean }) {
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
			launchState as Awaited<ReturnType<typeof Network.getNetworkStateAsync>>,
		);

	return { remove, listeners };
}

beforeEach(() => {
	jest.clearAllMocks();
});

describe("createNetworkConnectivity()", () => {
	it("reports the connection the subscription started on", async () => {
		mockNetwork({ isConnected: false });
		const onChange = jest.fn();

		createNetworkConnectivity().subscribe(onChange);
		await Promise.resolve();

		expect(onChange).toHaveBeenCalledWith(false);
	});

	it("reports every change the device makes", async () => {
		const { listeners } = mockNetwork({ isConnected: true });
		const onChange = jest.fn();

		createNetworkConnectivity().subscribe(onChange);
		listeners[0]?.({ isConnected: false });
		listeners[0]?.({ isConnected: true });

		expect(onChange.mock.calls).toEqual([[false], [true]]);
	});

	// the seed resolves a tick late, so a change that already arrived describes
	// the connection better than the state the read started with.
	it("does not let a late seed overturn a change that already arrived", async () => {
		const { listeners } = mockNetwork({ isConnected: true });
		const onChange = jest.fn();

		createNetworkConnectivity().subscribe(onChange);
		listeners[0]?.({ isConnected: false });
		await Promise.resolve();
		await Promise.resolve();

		expect(onChange.mock.calls).toEqual([[false]]);
	});

	it("stops listening once unsubscribed", () => {
		const { remove } = mockNetwork({ isConnected: true });

		createNetworkConnectivity().subscribe(jest.fn())();

		expect(remove).toHaveBeenCalledTimes(1);
	});

	it("survives a failed reading, leaving the caller its own default", async () => {
		mockNetwork({ isConnected: true });
		jest
			.mocked(Network.getNetworkStateAsync)
			.mockRejectedValue(new Error("no permission"));
		const onChange = jest.fn();

		createNetworkConnectivity().subscribe(onChange);
		await Promise.resolve();
		await Promise.resolve();

		expect(onChange).not.toHaveBeenCalled();
	});
});
