/**
 * flattens whatever React Native accepts as a `style` prop (an object, or an
 * arbitrarily nested array of them) into the single resolved object the
 * renderer would apply.
 */
export function resolveStyle(style: unknown): Record<string, unknown> {
	if (Array.isArray(style)) {
		return Object.assign({}, ...style.map(resolveStyle));
	}

	return typeof style === "object" && style !== null
		? (style as Record<string, unknown>)
		: {};
}
