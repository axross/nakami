// Jest mock for lucide-react-native, wired in via jest.config.cjs's
// moduleNameMapper. The package's `react-native` entry is ESM (`dist/esm/
// *.mjs`) that jest-expo's transform does not process, so importing an icon
// under test throws `SyntaxError: Unexpected token 'export'`. Rather than widen
// the deliberately-untouched transformIgnorePatterns (see jest.config.cjs), map
// the whole module to this stub.
//
// Every named export resolves — via a Proxy — to a no-op component, so any icon
// the app imports (now or later) renders as an empty fragment. Unit tests
// assert by testID and copy, never by icon glyph, so a stub is sufficient; the
// real SVG rendering is covered by the build and on-device checks. This mirrors
// the pre-migration tests, which stubbed the icon component to `() => null`.
const React = require("react");

function StubIcon() {
	return React.createElement(React.Fragment, null);
}

module.exports = new Proxy(
	{ __esModule: true },
	{
		get(target, key) {
			if (key in target || typeof key !== "string") {
				return target[key];
			}

			return StubIcon;
		},
	},
);
