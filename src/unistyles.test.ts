import { describe, expect, it } from "@jest/globals";
import { themes } from "./unistyles";

/**
 * recursively collects a value's leaf paths (`colors.text.accent.base`), so two
 * themes can be compared on shape alone — which names exist — independently of
 * the values sitting at them.
 */
function leafPaths(value: unknown, prefix = ""): string[] {
	if (typeof value !== "object" || value === null) {
		return [prefix];
	}

	return Object.entries(value).flatMap(([key, child]) =>
		leafPaths(child, prefix === "" ? key : `${prefix}.${key}`),
	);
}

describe("themes", () => {
	// a surface can only reference a token that exists in both schemes; a name
	// present in one theme alone renders as `undefined` in the other.
	it("declares identical token shapes in light and dark", () => {
		expect(leafPaths(themes.dark).sort()).toEqual(
			leafPaths(themes.light).sort(),
		);
	});

	// every text style in the app spreads a role rather than setting its own
	// metrics, so nothing below is checked by the type-checker at the use site:
	// a role that lost a property would silently fall back to the platform
	// default on every screen that applies it.
	describe.each(["light", "dark"] as const)(
		"%s theme typography roles",
		(name) => {
			const roles = Object.entries(themes[name].typography);

			it("declares at least one role", () => {
				expect(roles.length).toBeGreaterThan(0);
			});

			it.each(roles)(
				"bundles family, size, and line height in %s",
				(_, role) => {
					expect(typeof role.fontFamily).toBe("string");
					expect(typeof role.fontSize).toBe("number");
					expect(typeof role.lineHeight).toBe("number");
				},
			);

			// weight lives in the font file (InnovatorGrotesk-SemiBold vs -Regular).
			// setting `fontWeight` alongside one makes React Native synthesize a
			// second weight on top of the real one.
			it.each(roles)("leaves weight to the font file in %s", (_, role) => {
				expect(role).not.toHaveProperty("fontWeight");
			});

			// only these three faces are bundled and registered in `app.json`; a
			// role naming anything else renders in the platform default instead.
			it.each(roles)("names a bundled font family in %s", (_, role) => {
				expect([
					"InnovatorGrotesk-Regular",
					"InnovatorGrotesk-SemiBold",
					"JetBrainsMono-Regular",
				]).toContain(role.fontFamily);
			});
		},
	);

	// both loading skeletons hand `easing.standard` to reanimated, which runs it
	// on the UI thread and rejects a function the worklets Babel plugin never
	// transformed. nothing at a use site catches that: the curve is read through
	// the theme like any other token, and a missing directive surfaces only as a
	// failed animation on a device. these assertions are also what confirm the
	// metadata survives being registered as part of the theme object.
	describe.each(["light", "dark"] as const)("%s theme easing", (name) => {
		const { standard } = themes[name].easing;

		it("carries worklet metadata in standard", () => {
			expect(standard).toHaveProperty("__workletHash");
		});

		// an empty closure is what makes the curve shareable on its own; a worklet
		// that captured a module-scope binding would drag that binding across too.
		it("captures nothing from module scope in standard", () => {
			expect(standard).toHaveProperty("__closure", {});
		});

		// the ease-in-out quad `withTiming` already defaults to, so naming the
		// curve explicitly leaves every existing animation rendering as it did.
		it("eases in and out around the midpoint in standard", () => {
			expect(standard(0)).toBe(0);
			expect(standard(0.25)).toBe(0.125);
			expect(standard(0.5)).toBe(0.5);
			expect(standard(0.75)).toBe(0.875);
			expect(standard(1)).toBe(1);
		});
	});

	// a record field row draws its label and its Payload field name on one line,
	// which lines up only while the two roles share a line box. nothing at a use
	// site catches a drift: each style spreads a role whole, so a retuned role
	// still renders — just off the baseline it was meant to share.
	it.each(["light", "dark"] as const)(
		"gives caption and codeCaption a shared 18pt line box in %s",
		(name) => {
			const { caption, codeCaption } = themes[name].typography;

			expect(caption.lineHeight).toBe(18);
			expect(codeCaption.lineHeight).toBe(18);
			expect(codeCaption.fontFamily).toBe("JetBrainsMono-Regular");
		},
	);

	// a record card's height is fixed by RECORD_CARD_LINE (22), which the title
	// row reaches from its own role rather than from an override at the use site.
	it("gives heading, body, and code the record card's 22pt line box", () => {
		expect(themes.light.typography.heading.lineHeight).toBe(22);
		expect(themes.light.typography.body.lineHeight).toBe(22);
		expect(themes.light.typography.code.lineHeight).toBe(22);
	});
});
