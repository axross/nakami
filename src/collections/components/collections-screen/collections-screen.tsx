import type { JSX } from "react";
import { FlatList, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { CollectionListItem } from "~/collections/components/collection-list-item/collection-list-item";
import { CollectionListSkeleton } from "~/collections/components/collection-list-skeleton/collection-list-skeleton";
import { CollectionsMessageState } from "~/collections/components/collections-message-state/collections-message-state";
import { useCollections } from "~/collections/queries/use-collections";

function CollectionListDivider(): JSX.Element {
	return <View style={styles.divider} />;
}

/**
 * The Collections tab: lists the signed-in server's readable, non-system
 * collections, each row opening its (placeholder) detail screen. Renders a
 * loading skeleton, an error state with retry, an empty state, or the list.
 */
export function CollectionsScreen(): JSX.Element {
	const { theme } = useUnistyles();
	const { data, isPending, isError, refetch } = useCollections();

	let content: JSX.Element;
	if (isPending) {
		content = <CollectionListSkeleton />;
	} else if (isError) {
		content = (
			<CollectionsMessageState
				action={{
					label: "Try again",
					onPress: () => {
						void refetch();
					},
					testID: "collections-retry-button",
				}}
				iconColor={theme.colors.danger}
				iconName="alert-circle-outline"
				subtitle="We couldn't reach the server. Check your connection and try again."
				testID="collections-error"
				title="Couldn't load"
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
				iconName="folder-open-outline"
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
		backgroundColor: theme.colors.backgroundElevated,
		borderColor: theme.colors.border,
		borderRadius: theme.radiusSizes.md,
		borderWidth: 1,
		margin: theme.gapSizes.x16,
		overflow: "hidden",
	},
	divider: {
		backgroundColor: theme.colors.border,
		height: 1,
	},
	list: {
		backgroundColor: theme.colors.background,
		flex: 1,
	},
	root: {
		backgroundColor: theme.colors.background,
		flex: 1,
	},
}));
