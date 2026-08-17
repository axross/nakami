/**
 * turns a Payload collection slug into a display name. Payload exposes no
 * collection labels over REST, so the slug is the only source: split on `-`/`_`
 * word separators and title-case each word (`"blog-posts"` → `"Blog Posts"`).
 * a slug with no word characters falls back to itself.
 */
export function humanizeSlug(slug: string): string {
	const words = slug
		.split(/[-_]+/)
		.filter((word) => word.length > 0)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1));

	return words.length > 0 ? words.join(" ") : slug;
}
