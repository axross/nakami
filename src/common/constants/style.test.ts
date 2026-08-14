import { describe, expect, it } from "@jest/globals";
import { themes } from "./style";

/**
 * Recursively collects a value's leaf paths (`colors.text.accent.base`), so two
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
	// A surface can only reference a token that exists in both schemes; a name
	// present in one theme alone renders as `undefined` in the other.
	it("declares identical token shapes in light and dark", () => {
		expect(leafPaths(themes.dark).sort()).toEqual(
			leafPaths(themes.light).sort(),
		);
	});

	// Every text style in the app spreads a role rather than setting its own
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

			// Weight lives in the font file (InnovatorGrotesk-SemiBold vs -Regular).
			// Setting `fontWeight` alongside one makes React Native synthesize a
			// second weight on top of the real one.
			it.each(roles)("leaves weight to the font file in %s", (_, role) => {
				expect(role).not.toHaveProperty("fontWeight");
			});

			// Only these three faces are bundled and registered in `app.json`; a
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

	// A record card's height is fixed by RECORD_CARD_LINE (22), which the title
	// row reaches from its own role rather than from an override at the use site.
	it("gives heading, body, and code the record card's 22pt line box", () => {
		expect(themes.light.typography.heading.lineHeight).toBe(22);
		expect(themes.light.typography.body.lineHeight).toBe(22);
		expect(themes.light.typography.code.lineHeight).toBe(22);
	});
});
