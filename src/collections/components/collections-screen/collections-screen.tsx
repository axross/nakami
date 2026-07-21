import type { JSX } from "react";
import { FlatList, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { CollectionListItem } from "~/collections/components/collection-list-item/collection-list-item";
import { CollectionListSkeleton } from "~/collections/components/collection-list-skeleton/collection-list-skeleton";
import { CollectionsMessageState } from "~/collections/components/collections-message-state/collections-message-state";
import { useCollections } from "~/collections/queries/use-collections";
import type { MessageStateIconName } from "~/common/components/message-state/message-state";
import { PayloadRequestError } from "~/common/helpers/payload-client";

interface ErrorCopy {
	readonly title: string;
	readonly subtitle: string;
	readonly iconName: MessageStateIconName;
	readonly tone: "danger" | "muted";
	readonly retryable: boolean;
}

/**
 * Maps a load failure to user-facing copy. A permission failure is an expected
 * account/config state, so it gets a distinct, non-alarming message and no
 * retry (retrying can't grant access); connectivity and unexpected failures
 * offer a retry.
 */
function describeError(error: unknown): ErrorCopy {
	if (error instanceof PayloadRequestError && error.kind === "auth") {
		return {
			title: "Can't access collections",
			subtitle:
				"Your account doesn't have permission to view this server's collections.",
			iconName: "lock-outline",
			tone: "muted",
			retryable: false,
		};
	}

	if (error instanceof PayloadRequestError && error.kind === "network") {
		return {
			title: "Couldn't load",
			subtitle:
				"We couldn't reach the server. Check your connection and try again.",
			iconName: "alert-circle-outline",
			tone: "danger",
			retryable: true,
		};
	}

	return {
		title: "Couldn't load",
		subtitle: "Something went wrong loading collections. Please try again.",
		iconName: "alert-circle-outline",
		tone: "danger",
		retryable: true,
	};
}

function CollectionListDivider(): JSX.Element {
	return <View style={styles.divider} />;
}

/**
 * The Collections tab: lists the signed-in server's readable, non-system
 * collections, each row opening its (placeholder) detail screen. Renders a
 * loading skeleton, an error state (with a message tailored to the failure),
 * an empty state, or the list.
 */
export function CollectionsScreen(): JSX.Element {
	const { theme } = useUnistyles();
	const { data, isPending, isError, error, refetch } = useCollections();

	let content: JSX.Element;
	if (isPending) {
		content = <CollectionListSkeleton />;
	} else if (isError) {
		const copy = describeError(error);
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
				iconColor={
					copy.tone === "danger"
						? theme.colors.danger
						: theme.colors.textSecondary
				}
				iconName={copy.iconName}
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
