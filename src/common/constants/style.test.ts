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

	describe.each(["light", "dark"] as const)("%s theme text roles", (name) => {
		const roles = Object.entries(themes[name].text);

		it("declares at least one role", () => {
			expect(roles.length).toBeGreaterThan(0);
		});

		// A role is applied whole (`...theme.text.body`), so a role missing one of
		// the three would silently inherit whatever the platform defaults to.
		it.each(roles)("bundles family, size, and line height in %s", (_, role) => {
			expect(typeof role.fontFamily).toBe("string");
			expect(typeof role.fontSize).toBe("number");
			expect(typeof role.lineHeight).toBe("number");
		});

		// Weight lives in the font file (InnovatorGrotesk-SemiBold vs -Regular).
		// Setting `fontWeight` alongside one makes React Native synthesize a second
		// weight on top of the real one.
		it.each(roles)("leaves weight to the font file in %s", (_, role) => {
			expect(role).not.toHaveProperty("fontWeight");
		});
	});
});
