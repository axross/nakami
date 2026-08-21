// Jest mock for lucide-react-native, wired in via jest.config.cjs's
// moduleNameMapper. the package's `react-native` entry is ESM (`dist/esm/
// *.mjs`) that jest-expo's transform does not process, so importing an icon
// under test throws `SyntaxError: Unexpected token 'export'`. rather than widen
// the deliberately-untouched transformIgnorePatterns (see jest.config.cjs), map
// the whole module to this stub.
//
// every named export resolves — via a Proxy — to a no-op component, so any icon
// the app imports (now or later) renders as an empty fragment. no test asserts
// on a glyph; the real SVG rendering is covered by the build and on-device
// checks.
//
// each export is nonetheless its **own** component, memoized per name, and two
// reads of one name give the same one back. that is what makes an icon *choice*
// assertable: a mapping from a domain value to an icon can be checked with
// `toBe`, and a mapping that returned the wrong icon — or the same icon twice
// where two were meant — fails rather than passing because every stub was one
// object. a single shared stub made every such assertion incapable of failing.
const React = require("react");

/** @type {Map<string, () => React.ReactElement>} */
const icons = new Map();

function iconNamed(name) {
	const existing = icons.get(name);

	if (existing !== undefined) {
		return existing;
	}

	function StubIcon() {
		return React.createElement(React.Fragment, null);
	}

	// what a failed `toBe` prints, and what a render tree shows the icon as.
	StubIcon.displayName = name;
	icons.set(name, StubIcon);

	return StubIcon;
}

module.exports = new Proxy(
	{ __esModule: true },
	{
		get(target, key) {
			if (key in target || typeof key !== "string") {
				return target[key];
			}

			return iconNamed(key);
		},
	},
);
