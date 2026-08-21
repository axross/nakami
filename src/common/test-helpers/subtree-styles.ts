import { resolveStyle } from "./resolve-style";

/**
 * every style in a rendered subtree, flattened, so an element that carries no
 * test hook of its own can still be asserted on by its shape. an element
 * appears more than once (a composite node and the host node under it both hold
 * the style prop), so this answers "is there one like this" rather than "how
 * many".
 *
 * this is what a skeleton's placeholders are reached through. they deliberately
 * carry no hook: this project's e2e runner matches an identifier flatly across
 * the whole screen, so a hook repeated across sibling placeholders would not be
 * the globally unique one that runner needs.
 */
export function subtreeStyles(node: unknown): Record<string, unknown>[] {
	if (typeof node !== "object" || node === null) {
		return [];
	}

	const { props, children } = node as {
		props?: { style?: unknown };
		children?: readonly unknown[];
	};

	return [
		...(props?.style === undefined ? [] : [resolveStyle(props.style)]),
		...(children ?? []).flatMap(subtreeStyles),
	];
}
