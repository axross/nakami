import { Stack, useLocalSearchParams } from "expo-router";
import type { JSX } from "react";
import { z } from "zod";
import { CollectionRecordsScreen } from "~/collections/components/collection-records-screen/collection-records-screen";
import { humanizeSlug } from "~/collections/helpers/humanize-slug";

// deep-link params are untrusted; validate before use.
const paramsSchema = z.object({ slug: z.string().min(1) });

/**
 * validates the deep-linked `slug` param and renders the collection's record
 * list, titling the stack header with its humanized name. an invalid slug
 * renders the screen with an empty slug, which surfaces the query's error state.
 */
export default function CollectionRecordsRoute(): JSX.Element {
	const params = useLocalSearchParams();
	const parsed = paramsSchema.safeParse(params);
	const slug = parsed.success ? parsed.data.slug : "";
	const label = parsed.success ? humanizeSlug(parsed.data.slug) : "Collection";

	return (
		<>
			<Stack.Screen options={{ title: label }} />
			<CollectionRecordsScreen slug={slug} />
		</>
	);
}
