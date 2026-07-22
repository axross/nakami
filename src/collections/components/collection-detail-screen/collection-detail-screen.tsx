import type { JSX } from "react";
import { CollectionsMessageState } from "~/collections/components/collections-message-state/collections-message-state";

/**
 * Placeholder for a collection's record list. Browsing records ships in a
 * follow-up issue; this confirms the tapped collection and sets expectations,
 * reusing the shared message-state surface.
 */
export function CollectionDetailScreen({
	label,
}: Readonly<{ label: string }>): JSX.Element {
	return (
		<CollectionsMessageState
			iconName="format-list-bulleted"
			subtitle={`Browsing the records in ${label} lands in a follow-up update.`}
			testID="collection-detail-screen"
			title="Records coming soon"
		/>
	);
}
