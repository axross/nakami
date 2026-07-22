// Jest mock for react-native-reanimated, wired in via jest.config.cjs for the
// `react-native-reanimated/mock` subpath expo-router's testing-library
// requires (see that file for why only `/mock`, not the bare specifier, is
// mapped). The package's published v4 `/mock` entry is broken (it requires an
// absent
// `./src/mock`), so expo-router's testing-library otherwise falls back to an
// empty module, dropping hooks like useReducedMotion. This reduces the
// animation helpers to synchronous pass-throughs and renders an animated view
// as a plain fragment, so a component that animates still mounts under test.
//
// It imports `react` ONLY — never `react-native`. This file is required while
// jest is mid-evaluating the react-native-reanimated mock factory; pulling in
// react-native there re-enters that factory (react-native's test deps import
// reanimated) and blows the stack.
const React = require("react");

function AnimatedView(props) {
	return React.createElement(React.Fragment, null, props.children ?? null);
}

module.exports = {
	__esModule: true,
	default: { View: AnimatedView },
	useReducedMotion: () => false,
	useSharedValue: (initial) => ({ value: initial }),
	useAnimatedStyle: (factory) => factory(),
	withRepeat: (animation) => animation,
	withSequence: (...animations) => animations[animations.length - 1],
	withTiming: (toValue) => toValue,
	cancelAnimation: () => {},
};
