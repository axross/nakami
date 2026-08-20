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
import { describeOfflineLoad } from "~/collections/helpers/describe-collections-offline";
import type { CollectionRecord } from "~/collections/models/record";
import { getCollectionRecordsInfiniteQueryOptions } from "~/collections/queries/collection-records-query";

// subject nouns for the shared load-error mapper (the taxonomy — icon, tone,
// retryability — is shared with the collection list).
const RECORDS_LOAD_ERROR = {
	accessTitle: "Can't access records",
	accessSubtitle:
		"Your account doesn't have permission to view this collection's records.",
	genericSubtitle: "Something went wrong loading records. Please try again.",
} as const;

// the subject-specific half of the offline surface; its title, status line, and
// icon are shared with the collection list.
const RECORDS_OFFLINE_SUBTITLE =
	"Records will load as soon as you're back online.";

function RecordCount({ total }: Readonly<{ total: number }>): JSX.Element {
	return (
		<Text style={styles.count}>
			{total} {total === 1 ? "record" : "records"}
		</Text>
	);
}

/**
 * a collection's records: the screen a Collections row opens. renders an offline
 * state, a loading skeleton, a failure-aware error state (permission failures
 * get calm, retry-less copy; connectivity/unexpected failures offer a retry), an
 * empty state, or the paginated card feed — appending the next page on scroll.
 * each card opens that record's own detail screen.
 */
export function CollectionRecordsScreen({
	slug,
}: Readonly<{ slug: string }>): JSX.Element {
	const { theme } = useUnistyles();
	const session = useAuthSession();
	const {
		data,
		isPending,
		fetchStatus,
		isError,
		error,
		refetch,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useInfiniteQuery({
		...getCollectionRecordsInfiniteQueryOptions({
			userId: session?.user.id ?? "",
			slug,
		}),
		enabled: session !== null,
	});

	let content: JSX.Element;
	// ahead of the skeleton on purpose. with no connection the first page pauses
	// rather than failing, so the query stays `pending` with nothing cached and
	// the skeleton below would pulse indefinitely with nothing on its way. a feed
	// that already holds records is past `pending` and keeps showing them.
	if (isPending && fetchStatus === "paused") {
		const copy = describeOfflineLoad(RECORDS_OFFLINE_SUBTITLE);
		content = (
			<CollectionsMessageState
				icon={copy.icon}
				iconColor={theme.colors.text.neutral.base}
				status={copy.status}
				style={styles.messageState}
				subtitle={copy.subtitle}
				testID="collection-records-offline"
				title={copy.title}
			/>
		);
	} else if (isPending) {
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
				style={styles.messageState}
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
					style={styles.messageState}
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
					renderItem={({ item }) => (
						<CollectionRecordCard record={item} slug={slug} />
					)}
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

const styles = StyleSheet.create((theme, rt) => ({
	count: {
		...theme.typography.caption,
		paddingHorizontal: theme.gap.xs,
		paddingBottom: theme.gap.xs,
		color: theme.colors.text.neutral.base,
	},
	footer: {
		paddingVertical: theme.gap.md,
	},
	// a stack header clears the top edge and the tab bar the bottom, so this
	// screen owns only the horizontal pair — carried on the feed's content
	// container, not on the list itself, which would inset its scroll indicators
	// and leave the cards stopping short of the screen edge.
	// `CollectionRecordsSkeleton` mirrors these values, or the feed would shift
	// when the records arrive.
	list: {
		gap: theme.gap.sm,
		paddingTop: theme.gap.md,
		paddingBottom: theme.gap.md,
		paddingStart: Math.max(rt.insets.left, theme.gap.md),
		paddingEnd: Math.max(rt.insets.right, theme.gap.md),
	},
	// the message state claims no space of its own, so this screen — which gives
	// it the whole surface — supplies the fill.
	messageState: {
		flex: 1,
	},
	root: {
		flex: 1,
		backgroundColor: theme.colors.foundation.neutral.bare,
	},
}));
