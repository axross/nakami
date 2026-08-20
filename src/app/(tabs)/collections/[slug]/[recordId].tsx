import { useLocalSearchParams } from "expo-router";
import type { JSX } from "react";
import { z } from "zod";
import { CollectionRecordScreen } from "~/collections/components/collection-record-screen/collection-record-screen";

// deep-link params are untrusted; validate before use.
const paramsSchema = z.object({
	slug: z.string().min(1),
	recordId: z.string().min(1),
});

/**
 * validates the deep-linked `slug` and `recordId` params and renders that one
 * record's fields. a route carrying neither usable value renders the screen
 * with empty ones, which is what makes it show its load-failure state instead
 * of an empty record. the stack header's title is the record's own derived
 * title, so it belongs to the screen that loads it rather than to this file.
 */
export default function CollectionRecordRoute(): JSX.Element {
	const params = useLocalSearchParams();
	const parsed = paramsSchema.safeParse(params);

	return (
		<CollectionRecordScreen
			recordId={parsed.success ? parsed.data.recordId : ""}
			slug={parsed.success ? parsed.data.slug : ""}
		/>
	);
}
