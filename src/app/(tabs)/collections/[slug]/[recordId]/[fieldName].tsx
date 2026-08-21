import { useLocalSearchParams } from "expo-router";
import type { JSX } from "react";
import { z } from "zod";
import { CollectionFieldEditorScreen } from "~/collections/components/collection-field-editor-screen/collection-field-editor-screen";

// deep-link params are untrusted; validate before use.
const paramsSchema = z.object({
	slug: z.string().min(1),
	recordId: z.string().min(1),
	fieldName: z.string().min(1),
});

/**
 * validates the deep-linked `slug`, `recordId`, and `fieldName` params and
 * renders that one field's editor. a route carrying anything unusable renders
 * the screen with empty values, which is what makes it state that there is no
 * field to edit rather than opening an editor over nothing. the presentation —
 * a sheet over the record, with its own header rather than the navigator's — is
 * registered on the Collections stack.
 */
export default function CollectionFieldEditorRoute(): JSX.Element {
	const params = useLocalSearchParams();
	const parsed = paramsSchema.safeParse(params);

	return (
		<CollectionFieldEditorScreen
			fieldName={parsed.success ? parsed.data.fieldName : ""}
			recordId={parsed.success ? parsed.data.recordId : ""}
			slug={parsed.success ? parsed.data.slug : ""}
		/>
	);
}
