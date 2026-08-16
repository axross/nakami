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
import { getCollectionListQueryOptions } from "~/collections/queries/collection-list-query";

// Subject nouns for the shared load-error mapper (the taxonomy — icon, tone,
// retryability — is shared with the records list).
const COLLECTIONS_LOAD_ERROR = {
	accessTitle: "Can't access collections",
	accessSubtitle:
		"Your account doesn't have permission to view this server's collections.",
	genericSubtitle:
		"Something went wrong loading collections. Please try again.",
} as const;

function CollectionListDivider(): JSX.Element {
	return <View style={styles.divider} />;
}

/**
 * The Collections tab: lists the signed-in server's readable, non-system
 * collections, each row opening that collection's record list. Renders a
 * loading skeleton, an error state (with a message tailored to the failure),
 * an empty state, or the list.
 */
export function CollectionsScreen(): JSX.Element {
	const { theme } = useUnistyles();
	const session = useAuthSession();
	const { data, isPending, isError, error, refetch } = useQuery({
		...getCollectionListQueryOptions({
			serverUrl: session?.serverUrl ?? "",
			userId: session?.user.id ?? "",
		}),
		enabled: session !== null,
	});

	let content: JSX.Element;
	if (isPending) {
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
				contentContainerStyle={styles.card}
				data={data}
				ItemSeparatorComponent={CollectionListDivider}
				keyExtractor={(collection) => collection.slug}
				renderItem={({ item }) => <CollectionListItem collection={item} />}
				style={styles.list}
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

const styles = StyleSheet.create((theme) => ({
	card: {
		backgroundColor: theme.colors.foundation.neutral.subtle,
		borderColor: theme.colors.border.neutral.subtle,
		borderRadius: theme.gap.sm,
		borderWidth: 1,
		margin: theme.gap.md,
		overflow: "hidden",
	},
	divider: {
		backgroundColor: theme.colors.border.neutral.subtle,
		height: 1,
	},
	list: {
		backgroundColor: theme.colors.foundation.neutral.bare,
		flex: 1,
	},
	// The message state claims no space of its own, so this screen — which gives
	// it the whole tab — supplies the fill.
	messageState: {
		flex: 1,
	},
	root: {
		backgroundColor: theme.colors.foundation.neutral.bare,
		flex: 1,
	},
	// The skeleton claims no space of its own either, and it stands in for the
	// whole list.
	skeleton: {
		flex: 1,
	},
}));
