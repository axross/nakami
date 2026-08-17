import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	jest,
} from "@jest/globals";
import { render } from "@testing-library/react-native";
import * as Reanimated from "react-native-reanimated";
import { CollectionsMessageStateStatus } from "./collections-message-state-status";

// the animation is not reachable through the tree — the project's reanimated
// mock (see jest.config.cjs) renders `Animated.View` as an empty fragment — so
// these spies are the seam. `useAnimatedStyle` keeps the style factory, which
// reads the shared value at the moment it is called, so a test can ask what the
// dot would draw with after the effect has run. a module-level `jest.mock` of
// reanimated would not work here: `jest/enforce-imported-globals.js` loads
// expo-router's testing library, which mocks and requires reanimated first, so
// the module is already resolved by the time a test file registers its own.
const animatedStyles: (() => { opacity: number })[] = [];

/** the animated style the dot would draw with, read after the effect has run. */
function readPulse(): { opacity: number } {
	const factory = animatedStyles.at(-1);

	if (!factory) {
		throw new Error("the component created no animated style");
	}

	return factory();
}

beforeEach(() => {
	animatedStyles.length = 0;
	jest.spyOn(Reanimated, "useAnimatedStyle").mockImplementation((factory) => {
		const keep = factory as () => { opacity: number };
		animatedStyles.push(keep);

		// the project's mock resolves the hook to the plain style object the
		// component hands to its view; the real hook's handle type has no
		// counterpart under test.
		return keep() as unknown as ReturnType<typeof Reanimated.useAnimatedStyle>;
	});
	jest.spyOn(Reanimated, "withRepeat");
});

afterEach(() => {
	jest.restoreAllMocks();
});

describe("<CollectionsMessageStateStatus>", () => {
	it("renders its label and pulses the dot without end", () => {
		const { getByTestId, getByText } = render(
			<CollectionsMessageStateStatus
				label="Waiting for a connection"
				testID="collections-offline-status"
			/>,
		);

		expect(getByTestId("collections-offline-status")).toBeTruthy();
		expect(getByText("Waiting for a connection")).toBeTruthy();
		// -1 is reanimated's endless repeat count: the wait is ongoing, so the
		// pulse does not stop while the surface is up.
		expect(Reanimated.withRepeat).toHaveBeenCalledWith(
			expect.anything(),
			-1,
			false,
		);
	});

	it("holds a steady opacity when the device asks for reduced motion", () => {
		jest.spyOn(Reanimated, "useReducedMotion").mockReturnValue(true);

		const { getByText } = render(
			<CollectionsMessageStateStatus label="Waiting for a connection" />,
		);

		expect(getByText("Waiting for a connection")).toBeTruthy();
		expect(Reanimated.withRepeat).not.toHaveBeenCalled();
		expect(readPulse()).toEqual({ opacity: 0.6 });
	});
});
