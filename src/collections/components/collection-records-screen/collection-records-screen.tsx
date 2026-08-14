import { useInfiniteQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react-native";
import type { JSX } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { useAuthSession } from "~/auth/stores/auth-store";
import { CollectionRecordCard } from "~/collections/components/collection-record-card/collection-record-card";
import { CollectionRecordsSkeleton } from "~/collections/components/collection-records-skeleton/collection-records-skeleton";
import { CollectionsMessageState } from "~/collections/components/collections-message-state/collections-message-state";
import { describeLoadError } from "~/collections/helpers/describe-collections-error";
import type { CollectionRecord } from "~/collections/models/record";
import { getCollectionRecordsInfiniteQueryOptions } from "~/collections/queries/collection-records-query";

// Subject nouns for the shared load-error mapper (the taxonomy — icon, tone,
// retryability — is shared with the collection list).
const RECORDS_LOAD_ERROR = {
	accessTitle: "Can't access records",
	accessSubtitle:
		"Your account doesn't have permission to view this collection's records.",
	genericSubtitle: "Something went wrong loading records. Please try again.",
} as const;

function RecordCount({ total }: Readonly<{ total: number }>): JSX.Element {
	return (
		<Text style={styles.count}>
			{total} {total === 1 ? "record" : "records"}
		</Text>
	);
}

/**
 * A collection's records: the screen a Collections row opens. Renders a loading
 * skeleton, a failure-aware error state (permission failures get calm, retry-less
 * copy; connectivity/unexpected failures offer a retry), an empty state, or the
 * paginated card feed — appending the next page on scroll. Rows are read-only;
 * browsing into a single record is a follow-up.
 */
export function CollectionRecordsScreen({
	slug,
}: Readonly<{ slug: string }>): JSX.Element {
	const { theme } = useUnistyles();
	const session = useAuthSession();
	const {
		data,
		isPending,
		isError,
		error,
		refetch,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useInfiniteQuery({
		...getCollectionRecordsInfiniteQueryOptions({
			serverUrl: session?.serverUrl ?? "",
			userId: session?.user.id ?? "",
			slug,
		}),
		enabled: session !== null,
	});

	let content: JSX.Element;
	if (isPending) {
		content = <CollectionRecordsSkeleton />;
	} else if (isError) {
		const copy = describeLoadError(error, RECORDS_LOAD_ERROR);
		content = (
			<CollectionsMessageState
				action={
					copy.retryable
						? {
								label: "Try again",
								onPress: () => {
									void refetch();
								},
								testID: "collection-records-retry-button",
							}
						: undefined
				}
				icon={copy.icon}
				iconColor={
					copy.tone === "danger"
						? theme.colors.text.destructive.base
						: theme.colors.text.neutral.base
				}
				subtitle={copy.subtitle}
				testID="collection-records-error"
				title={copy.title}
			/>
		);
	} else {
		const records = data.pages.flatMap((page) => page.records);

		if (records.length === 0) {
			content = (
				<CollectionsMessageState
					icon={FileText}
					subtitle="There are no records in this collection yet."
					testID="collection-records-empty"
					title="No records"
				/>
			);
		} else {
			content = (
				<FlatList
					contentContainerStyle={styles.list}
					data={records}
					keyExtractor={(record: CollectionRecord) => record.id}
					ListFooterComponent={
						isFetchingNextPage ? (
							<ActivityIndicator
								color={theme.colors.text.neutral.base}
								style={styles.footer}
							/>
						) : null
					}
					ListHeaderComponent={
						<RecordCount total={data.pages[0]?.totalDocs ?? records.length} />
					}
					onEndReached={() => {
						if (hasNextPage && !isFetchingNextPage) {
							void fetchNextPage();
						}
					}}
					onEndReachedThreshold={0.5}
					renderItem={({ item }) => <CollectionRecordCard record={item} />}
					testID="collection-records-list"
				/>
			);
		}
	}

	return (
		<View style={styles.root} testID="collection-records-screen">
			{content}
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	count: {
		...theme.typography.caption,
		color: theme.colors.text.neutral.base,
		paddingBottom: theme.gap.xs,
		paddingHorizontal: theme.gap.xs,
	},
	footer: {
		paddingVertical: theme.gap.md,
	},
	list: {
		gap: theme.gap.sm,
		padding: theme.gap.md,
	},
	root: {
		backgroundColor: theme.colors.foundation.neutral.bare,
		flex: 1,
	},
}));
