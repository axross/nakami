import { Stack, useLocalSearchParams } from "expo-router";
import type { JSX } from "react";
import { z } from "zod";
import { CollectionDetailScreen } from "~/collections/components/collection-detail-screen/collection-detail-screen";
import { humanizeSlug } from "~/collections/helpers/humanize-slug";

// Deep-link params are untrusted; validate before use.
const paramsSchema = z.object({ slug: z.string().min(1) });

/**
 * Validates the deep-linked `slug` param and renders the collection's
 * placeholder detail screen, titling the stack header with its humanized name.
 */
export default function CollectionDetailRoute(): JSX.Element {
	const params = useLocalSearchParams();
	const parsed = paramsSchema.safeParse(params);
	const label = parsed.success ? humanizeSlug(parsed.data.slug) : "Collection";

	return (
		<>
			<Stack.Screen options={{ title: label }} />
			<CollectionDetailScreen label={label} />
		</>
	);
}
