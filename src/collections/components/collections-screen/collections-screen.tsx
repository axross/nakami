import { useQuery } from "@tanstack/react-query";
import { FolderOpen } from "lucide-react-native";
import type { JSX } from "react";
import { FlatList, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { useAuthSession } from "~/auth/stores/auth-store";
import { CollectionListItem } from "~/collections/components/collection-list-item/collection-list-item";
import { CollectionListSkeleton } from "~/collections/components/collection-list-skeleton/collection-list-skeleton";
import { CollectionsMessageState } from "~/collections/components/collections-message-state/collections-message-state";
import { describeLoadError } from "~/collections/helpers/describe-collections-error";
import { describeOfflineLoad } from "~/collections/helpers/describe-collections-offline";
import { getCollectionListQueryOptions } from "~/collections/queries/collection-list-query";

// subject nouns for the shared load-error mapper (the taxonomy — icon, tone,
// retryability — is shared with the records list).
const COLLECTIONS_LOAD_ERROR = {
	accessTitle: "Can't access collections",
	accessSubtitle:
		"Your account doesn't have permission to view this server's collections.",
	genericSubtitle:
		"Something went wrong loading collections. Please try again.",
} as const;

// the subject-specific half of the offline surface; its title, status line, and
// icon are shared with the records list.
const COLLECTIONS_OFFLINE_SUBTITLE =
	"Collections will load as soon as you're back online.";

/**
 * the Collections tab: lists the signed-in server's readable, non-system
 * collections, each card opening that collection's record list. renders an
 * offline state, a loading skeleton, an error state (with a message tailored to
 * the failure), an empty state, or the list.
 */
export function CollectionsScreen(): JSX.Element {
	const { theme } = useUnistyles();
	const session = useAuthSession();
	const { data, isPending, fetchStatus, isError, error, refetch } = useQuery({
		...getCollectionListQueryOptions({ userId: session?.user.id ?? "" }),
		enabled: session !== null,
	});

	let content: JSX.Element;
	// ahead of the skeleton on purpose. with no connection the query pauses
	// rather than failing, so it stays `pending` with nothing cached and the
	// skeleton below would pulse indefinitely with nothing on its way.
	if (isPending && fetchStatus === "paused") {
		const copy = describeOfflineLoad(COLLECTIONS_OFFLINE_SUBTITLE);
		content = (
			<CollectionsMessageState
				icon={copy.icon}
				iconColor={theme.colors.text.neutral.base}
				status={copy.status}
				style={styles.messageState}
				subtitle={copy.subtitle}
				testID="collections-offline"
				title={copy.title}
			/>
		);
	} else if (isPending) {
		content = <CollectionListSkeleton style={styles.skeleton} />;
	} else if (isError) {
		const copy = describeLoadError(error, COLLECTIONS_LOAD_ERROR);
		content = (
			<CollectionsMessageState
				action={
					copy.retryable
						? {
								label: "Try again",
								onPress: () => {
									void refetch();
								},
								testID: "collections-retry-button",
							}
						: undefined
				}
				icon={copy.icon}
				iconColor={
					copy.tone === "danger"
						? theme.colors.text.destructive.base
						: theme.colors.text.neutral.base
				}
				style={styles.messageState}
				subtitle={copy.subtitle}
				testID="collections-error"
				title={copy.title}
			/>
		);
	} else if (data && data.length > 0) {
		content = (
			<FlatList
				contentContainerStyle={styles.feed}
				data={data}
				keyExtractor={(collection) => collection.slug}
				renderItem={({ item }) => <CollectionListItem collection={item} />}
				style={styles.list}
				testID="collections-list"
			/>
		);
	} else {
		content = (
			<CollectionsMessageState
				icon={FolderOpen}
				style={styles.messageState}
				subtitle="There are no collections to show for this account."
				testID="collections-empty"
				title="No collections"
			/>
		);
	}

	return (
		<View style={styles.root} testID="collections-screen">
			{content}
		</View>
	);
}

const styles = StyleSheet.create((theme, rt) => ({
	// the record feed's own content container (see collection-records-screen):
	// each collection carries its own card, so what is left here is the space
	// between them and the space around them. a stack header clears the top edge
	// and the tab bar the bottom, so this screen owns only the horizontal pair —
	// carried on the list's content container, not on the list itself, which
	// would inset its scroll indicators and leave the cards stopping short of
	// the screen edge. `CollectionListSkeleton` mirrors these values, or the
	// list would shift when the collections arrive.
	feed: {
		gap: theme.gap.sm,
		paddingTop: theme.gap.md,
		paddingBottom: theme.gap.md,
		paddingStart: Math.max(rt.insets.left, theme.gap.md),
		paddingEnd: Math.max(rt.insets.right, theme.gap.md),
	},
	list: {
		flex: 1,
		backgroundColor: theme.colors.foundation.neutral.bare,
	},
	// the message state claims no space of its own, so this screen — which gives
	// it the whole tab — supplies the fill.
	messageState: {
		flex: 1,
	},
	root: {
		flex: 1,
		backgroundColor: theme.colors.foundation.neutral.bare,
	},
	// the skeleton claims no space of its own either, and it stands in for the
	// whole list.
	skeleton: {
		flex: 1,
	},
}));
