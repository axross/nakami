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

/**
 * the icon a collection falls back to when its slug says nothing recognizable.
 * a neutral mark is deliberately preferred to a confident wrong one.
 */
const FALLBACK_ICON: LucideIcon = Box;

/**
 * the vocabulary each icon answers to, in singular form. exported because it is
 * the specification of the mapping rather than an implementation detail, and
 * because the colocated test asserts the invariant the table rests on: no
 * keyword appears under two icons.
 *
 * a word that fits two categories equally is deliberately absent from both —
 * `episode` belongs to video and to audio, so leaving it out lets
 * `podcast-episodes` fall through to `podcast`, which does decide. assigning an
 * ambiguous word to one category is how this kind of guess becomes confidently
 * wrong.
 */
export const COLLECTION_ICON_KEYWORDS: readonly {
	readonly icon: LucideIcon;
	readonly keywords: readonly string[];
}[] = [
	{
		icon: FileText,
		keywords: [
			"post",
			"article",
			"blog",
			"page",
			"doc",
			"document",
			"news",
			"story",
			"entry",
			"note",
			"essay",
			"publication",
			"guide",
			"faq",
			"policy",
			"term",
		],
	},
	{
		icon: Image,
		keywords: [
			"image",
			"img",
			"photo",
			"picture",
			"gallery",
			"media",
			"banner",
			"thumbnail",
			"avatar",
			"logo",
			"screenshot",
		],
	},
	{
		icon: Film,
		keywords: ["video", "movie", "film", "clip", "reel", "footage", "stream"],
	},
	{
		icon: Piano,
		keywords: [
			"audio",
			"sound",
			"song",
			"track",
			"music",
			"podcast",
			"recording",
			"voice",
			"playlist",
		],
	},
	{
		icon: ShoppingCart,
		keywords: [
			"product",
			"shop",
			"catalog",
			"catalogue",
			"sku",
			"merch",
			"merchandise",
			"cart",
			"price",
			"pricing",
			"inventory",
			"variant",
		],
	},
	{
		icon: Code,
		keywords: [
			"code",
			"snippet",
			"script",
			"block",
			"embed",
			"api",
			"sdk",
			"function",
			"module",
		],
	},
	{
		icon: Link,
		keywords: ["link", "url", "bookmark", "redirect", "shortlink", "referral"],
	},
	{
		icon: ContactRound,
		keywords: [
			"contact",
			"lead",
			"subscriber",
			"client",
			"customer",
			"person",
			"people",
			"vendor",
			"supplier",
		],
	},
	{
		icon: Users,
		keywords: [
			"user",
			"member",
			"account",
			"admin",
			"author",
			"editor",
			"staff",
			"team",
			"profile",
			"role",
			"group",
		],
	},
	{
		icon: Tags,
		keywords: ["category", "tag", "topic", "taxonomy", "label", "section"],
	},
	{
		icon: ClipboardList,
		keywords: [
			"form",
			"submission",
			"response",
			"survey",
			"application",
			"enquiry",
			"inquiry",
		],
	},
	{
		icon: CalendarDays,
		keywords: [
			"event",
			"session",
			"schedule",
			"webinar",
			"workshop",
			"booking",
			"appointment",
		],
	},
	{
		// `store` sits here rather than under products: a "stores" collection is
		// far more often a shop locator than a catalogue.
		icon: MapPin,
		keywords: [
			"location",
			"place",
			"venue",
			"branch",
			"store",
			"address",
			"region",
			"city",
		],
	},
	{
		icon: Building2,
		keywords: [
			"company",
			"organization",
			"organisation",
			"brand",
			"agency",
			"partner",
			"department",
		],
	},
	{
		icon: MessageSquare,
		keywords: [
			"comment",
			"review",
			"message",
			"reply",
			"feedback",
			"testimonial",
			"rating",
		],
	},
	{
		icon: Receipt,
		keywords: [
			"order",
			"invoice",
			"transaction",
			"purchase",
			"payment",
			"receipt",
			"subscription",
		],
	},
	{
		icon: Menu,
		keywords: [
			"nav",
			"navigation",
			"menu",
			"footer",
			"header",
			"sitemap",
			"breadcrumb",
		],
	},
];

const ICON_BY_KEYWORD: ReadonlyMap<string, LucideIcon> = new Map(
	COLLECTION_ICON_KEYWORDS.flatMap(({ icon, keywords }) =>
		keywords.map((keyword): [string, LucideIcon] => [keyword, icon]),
	),
);

/**
 * trims a regular English plural so `posts` and `post` reach one keyword. it is
 * deliberately crude — an irregular such as `news` comes back as `new` — which
 * is why {@link lookUp} tries the word as it stands first.
 */
function toSingular(word: string): string {
	if (word.length > 4 && word.endsWith("ies")) {
		return `${word.slice(0, -3)}y`;
	}

	if (word.length > 4 && /(?:ch|sh|ss|x|z)es$/.test(word)) {
		return word.slice(0, -2);
	}

	if (word.length > 3 && word.endsWith("s") && !word.endsWith("ss")) {
		return word.slice(0, -1);
	}

	return word;
}

/** the icon a single word maps to, as it stands or once singularized. */
function lookUp(word: string): LucideIcon | undefined {
	return ICON_BY_KEYWORD.get(word) ?? ICON_BY_KEYWORD.get(toSingular(word));
}

/**
 * the icon a slug carrying no separators maps to, by splitting it into two
 * halves that are both keywords and agree on one icon — `blogposts` is blog and
 * posts, and both are documents.
 *
 * the agreement is what makes this safe. matching a bare suffix would read
 * `postcodes` as code and `cufflinks` as links, which is exactly the confident
 * wrong guess the fallback exists to avoid; requiring both halves to point the
 * same way leaves those two undecided instead.
 */
function resolveUnseparated(word: string): LucideIcon | undefined {
	for (let cut = word.length - 1; cut >= 1; cut -= 1) {
		const head = lookUp(word.slice(0, cut));

		if (head !== undefined && head === lookUp(word.slice(cut))) {
			return head;
		}
	}

	return undefined;
}

/**
 * guesses which icon a collection should wear from its slug, which is the only
 * thing Payload's REST API reports about it — there is no label, no icon, and
 * no type to read.
 *
 * the slug is lowercased and split on its separators, then scanned right to
 * left, because English puts the head noun last: `product-images` is images
 * rather than products. a slug that yields no match at all resolves to
 * {@link FALLBACK_ICON}.
 */
export function getCollectionIcon(slug: string): LucideIcon {
	const words = slug
		.toLowerCase()
		.split(/[^a-z0-9]+/)
		.filter((word) => word.length > 0);

	for (let index = words.length - 1; index >= 0; index -= 1) {
		const icon = lookUp(words[index]);

		if (icon !== undefined) {
			return icon;
		}
	}

	return resolveUnseparated(words.join("")) ?? FALLBACK_ICON;
}
