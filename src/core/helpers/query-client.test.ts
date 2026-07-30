import { afterEach, describe, expect, it, jest } from "@jest/globals";
import { AppState } from "react-native";
import { PayloadRequestError } from "~/common/helpers/payload-client";
import { isReportableQueryError } from "./query-client";

jest.mock("expo-network", () => ({
	addNetworkStateListener: jest.fn(() => ({ remove: jest.fn() })),
	getNetworkStateAsync: jest.fn(async () => ({ isConnected: true })),
}));

describe("isReportableQueryError", () => {
	it("does not report permission (auth) failures", () => {
		expect(
			isReportableQueryError(new PayloadRequestError("auth", "rejected", 403)),
		).toBe(false);
	});

	it("does not report connectivity (network) failures", () => {
		expect(
			isReportableQueryError(new PayloadRequestError("network", "unreachable")),
		).toBe(false);
	});

	it("reports unexpected server responses", () => {
		expect(
			isReportableQueryError(new PayloadRequestError("server", "boom", 500)),
		).toBe(true);
	});

	it("reports unparseable-payload and other unknown errors", () => {
		expect(isReportableQueryError(new Error("could not parse response"))).toBe(
			true,
		);
	});
});

type NetworkStateEvent = { isConnected?: boolean };
type Unsubscribe = (() => void) | undefined;
type OnlineSetup = (setOnline: (online: boolean) => void) => Unsubscribe;
type FocusSetup = (handleFocus: (focused?: boolean) => void) => Unsubscribe;
type NetworkListener = (event: NetworkStateEvent) => void;
type AppStateListener = (status: "active" | "background") => void;

/**
 * Loads `query-client` in a fresh module registry with both managers'
 * `setEventListener` stubbed, and hands back the setup function each manager
 * was registered with — or `undefined` where the module registered none.
 *
 * Registration is a module-scope side effect, so re-running it per test needs a
 * registry that has not already cached the module — this file's own import at
 * the top has. Stubbing `setEventListener` captures each setup while keeping
 * registration from subscribing for real, leaving the setups to be invoked
 * deliberately in the tests below.
 */
function loadQueryClientModule(platformOS: "ios" | "web" = "ios") {
	let onlineSetup: OnlineSetup | undefined;
	let focusSetup: FocusSetup | undefined;
	let network!: typeof import("expo-network");

	// `require` rather than `import()`: this Babel transform leaves dynamic
	// import as a real one, which the Jest VM cannot evaluate without
	// --experimental-vm-modules.
	jest.isolateModules(() => {
		const { focusManager, onlineManager } =
			require("@tanstack/react-query") as typeof import("@tanstack/react-query");
		const { Platform } =
			require("react-native") as typeof import("react-native");

		jest.replaceProperty(Platform, "OS", platformOS);

		const online = jest
			.spyOn(onlineManager, "setEventListener")
			.mockImplementation(() => undefined);
		const focus = jest
			.spyOn(focusManager, "setEventListener")
			.mockImplementation(() => undefined);

		require("./query-client");

		onlineSetup = online.mock.calls[0]?.[0] as OnlineSetup | undefined;
		focusSetup = focus.mock.calls[0]?.[0] as FocusSetup | undefined;
		network = require("expo-network") as typeof import("expo-network");
	});

	// `expo-network` is mocked by a factory, and Jest keeps one instance of such
	// a mock once the outer registry has instantiated it — the import at the top
	// of this file, whose own registration already called it. Drop that history
	// so each test reads back only the calls its own setup makes.
	jest.mocked(network.addNetworkStateListener).mockClear();
	jest.mocked(network.getNetworkStateAsync).mockClear();

	return { focusSetup, network, onlineSetup };
}

afterEach(() => {
	jest.restoreAllMocks();
});

describe("query client manager wiring", () => {
	it("installs an event listener on both managers", () => {
		const { focusSetup, onlineSetup } = loadQueryClientModule();

		expect(onlineSetup).toEqual(expect.any(Function));
		expect(focusSetup).toEqual(expect.any(Function));
	});

	it("leaves the focus manager on its own source on web", () => {
		const { focusSetup, onlineSetup } = loadQueryClientModule("web");

		expect(focusSetup).toBeUndefined();
		expect(onlineSetup).toEqual(expect.any(Function));
	});
});

describe("online manager listener", () => {
	it("reports a connectivity change and unsubscribes on teardown", () => {
		const { network, onlineSetup } = loadQueryClientModule();
		const remove = jest.fn();
		jest.mocked(network.addNetworkStateListener).mockReturnValue({ remove });
		const setOnline = jest.fn();

		const unsubscribe = onlineSetup?.(setOnline);
		const listener = jest.mocked(network.addNetworkStateListener).mock
			.calls[0]?.[0] as NetworkListener | undefined;
		listener?.({ isConnected: false });

		expect(setOnline).toHaveBeenCalledWith(false);

		unsubscribe?.();

		expect(remove).toHaveBeenCalled();
	});

	it("seeds the launch-time state, which no change event describes", async () => {
		const { network, onlineSetup } = loadQueryClientModule();
		jest
			.mocked(network.getNetworkStateAsync)
			.mockResolvedValue({ isConnected: false });
		const setOnline = jest.fn();

		onlineSetup?.(setOnline);
		await jest.mocked(network.getNetworkStateAsync).mock.results[0]?.value;

		expect(setOnline).toHaveBeenCalledWith(false);
	});

	it("does not let the seeded state overwrite an observed change", async () => {
		const { network, onlineSetup } = loadQueryClientModule();
		jest
			.mocked(network.getNetworkStateAsync)
			.mockResolvedValue({ isConnected: true });
		const setOnline = jest.fn();

		onlineSetup?.(setOnline);
		const listener = jest.mocked(network.addNetworkStateListener).mock
			.calls[0]?.[0] as NetworkListener | undefined;
		listener?.({ isConnected: false });
		await jest.mocked(network.getNetworkStateAsync).mock.results[0]?.value;

		expect(setOnline).toHaveBeenCalledTimes(1);
		expect(setOnline).toHaveBeenCalledWith(false);
	});

	it("stays subscribed when the launch-time probe rejects", async () => {
		const { network, onlineSetup } = loadQueryClientModule();
		jest
			.mocked(network.getNetworkStateAsync)
			.mockRejectedValue(new Error("connectivity unavailable"));
		const setOnline = jest.fn();

		const unsubscribe = onlineSetup?.(setOnline);
		await Promise.resolve();

		expect(unsubscribe).toEqual(expect.any(Function));
		expect(setOnline).not.toHaveBeenCalled();
	});
});

describe("focus manager listener", () => {
	it("maps app state to focus and unsubscribes on teardown", () => {
		const { focusSetup } = loadQueryClientModule();
		const remove = jest.fn();
		// The spy goes on this file's own `AppState`, not one pulled from the
		// isolated registry: React Native's entry point exposes `AppState`
		// through a lazy getter that re-`require`s on every access, so the setup
		// — invoked here, outside `isolateModules` — resolves the outer module.
		const addEventListener = jest
			.spyOn(AppState, "addEventListener")
			.mockReturnValue({ remove } as ReturnType<
				typeof AppState.addEventListener
			>);
		addEventListener.mockClear();
		const handleFocus = jest.fn();

		const unsubscribe = focusSetup?.(handleFocus);
		const [event, listener] = addEventListener.mock.calls.at(-1) ?? [];
		const onAppStateChange = listener as AppStateListener | undefined;

		expect(addEventListener).toHaveBeenCalledTimes(1);
		expect(event).toBe("change");

		onAppStateChange?.("active");
		onAppStateChange?.("background");

		expect(handleFocus).toHaveBeenNthCalledWith(1, true);
		expect(handleFocus).toHaveBeenNthCalledWith(2, false);

		unsubscribe?.();

		expect(remove).toHaveBeenCalled();
	});
});
