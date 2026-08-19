import { describe, expect, it } from "@jest/globals";
import {
	Box,
	Building2,
	CalendarDays,
	ClipboardList,
	Code,
	ContactRound,
	FileText,
	Film,
	Image,
	Link,
	type LucideIcon,
	MapPin,
	Menu,
	MessageSquare,
	Piano,
	Receipt,
	ShoppingCart,
	Tags,
	Users,
} from "lucide-react-native";
import { COLLECTION_ICON_KEYWORDS, getCollectionIcon } from "./collection-icon";

// one representative slug per category, so a category losing its icon fails
// here by name rather than as a count.
const SLUG_ICONS: readonly [slug: string, icon: LucideIcon][] = [
	["blog-posts", FileText],
	["media", Image],
	["videos", Film],
	["podcasts", Piano],
	["products", ShoppingCart],
	["code-snippets", Code],
	["links", Link],
	["contacts", ContactRound],
	["users", Users],
	["categories", Tags],
	["form-submissions", ClipboardList],
	["events", CalendarDays],
	["locations", MapPin],
	["companies", Building2],
	["reviews", MessageSquare],
	["orders", Receipt],
	["navigation", Menu],
];

describe("getCollectionIcon()", () => {
	it.each(SLUG_ICONS)("maps %s to its category icon", (slug, icon) => {
		expect(getCollectionIcon(slug)).toBe(icon);
	});

	// english puts the head noun last, so the rightmost match wins — the images
	// belong to the products rather than the other way round.
	it("resolves a compound slug by its last word", () => {
		expect(getCollectionIcon("product-images")).toBe(Image);
	});

	// `episode` is left out of both video and audio, which is what lets the
	// scan reach a word that decides.
	it("falls through a word that fits two categories equally", () => {
		expect(getCollectionIcon("podcast-episodes")).toBe(Piano);
	});

	it("reads a keyword that is already plural rather than trimming it", () => {
		expect(getCollectionIcon("news")).toBe(FileText);
	});

	it("reads a stores collection as a place rather than a catalogue", () => {
		expect(getCollectionIcon("stores")).toBe(MapPin);
	});

	it.each(["blog-posts", "blog_posts", "BlogPosts", "blog--posts"])(
		"resolves %s the same way regardless of separator or case",
		(slug) => {
			expect(getCollectionIcon(slug)).toBe(FileText);
		},
	);

	it("falls back when no word is recognized", () => {
		expect(getCollectionIcon("warehouse-zones")).toBe(Box);
	});

	// a bare suffix match would read these as code and as links. both halves
	// have to agree before an unseparated slug is decided at all.
	it.each(["postcodes", "cufflinks"])(
		"leaves %s undecided rather than guessing from its ending",
		(slug) => {
			expect(getCollectionIcon(slug)).toBe(Box);
		},
	);

	it.each(["", "--", "__"])("falls back on %p rather than throwing", (slug) => {
		expect(getCollectionIcon(slug)).toBe(Box);
	});
});

describe("COLLECTION_ICON_KEYWORDS", () => {
	// the lookup is a flat map, so a word listed under two icons would silently
	// resolve to whichever entry was built last.
	it("lists no keyword under two icons", () => {
		const keywords = COLLECTION_ICON_KEYWORDS.flatMap(
			(category) => category.keywords,
		);

		expect(keywords).toHaveLength(new Set(keywords).size);
	});

	it("lists every keyword in lowercase", () => {
		const keywords = COLLECTION_ICON_KEYWORDS.flatMap(
			(category) => category.keywords,
		);

		expect(
			keywords.filter((keyword) => keyword !== keyword.toLowerCase()),
		).toEqual([]);
	});
});
