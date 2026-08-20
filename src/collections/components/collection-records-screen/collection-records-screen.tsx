import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { FileText, SearchX } from "lucide-react-native";
import type { JSX } from "react";
import { useRef, useState } from "react";
import type {
	NativeScrollEvent,
	NativeSyntheticEvent,
	StyleProp,
	ViewStyle,
} from "react-native";
import { ActivityIndicator, FlatList, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { useAuthSession } from "~/auth/stores/auth-store";
import { CollectionRecordCard } from "~/collections/components/collection-record-card/collection-record-card";
import { CollectionRecordsHeader } from "~/collections/components/collection-records-header/collection-records-header";
import { CollectionRecordsSkeleton } from "~/collections/components/collection-records-skeleton/collection-records-skeleton";
import { CollectionsMessageState } from "~/collections/components/collections-message-state/collections-message-state";
import { describeLoadError } from "~/collections/helpers/describe-collections-error";
import { describeOfflineLoad } from "~/collections/helpers/describe-collections-offline";
import type { RecordCount } from "~/collections/helpers/record-count-label";
import { useDebouncedValue } from "~/collections/hooks/use-debounced-value";
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

// how long the typed query has to stand still before it is asked about. long
// enough that a word costs one request rather than one per letter, short enough
// that the feed still reads as answerable to the keyboard.
const SEARCH_DEBOUNCE_MS = 300;

// how far the feed has to move in one direction before the search section
// answers it. without a floor, the pixel of travel a finger leaves behind on
// touch-down would flip the section back and forth under the reader's thumb.
const SCROLL_DIRECTION_THRESHOLD = 8;

// how far down the feed has to be before scrolling can shrink the section at
// all: near the top there is nothing to make room for, and the count is worth
// more there than the space it costs.
const SCROLL_COLLAPSE_AFTER = 48;

/**
 * a collection's records: the screen a Collections row opens. renders an offline
 * state, a loading skeleton, a failure-aware error state (permission failures
 * get calm, retry-less copy; connectivity/unexpected failures offer a retry), an
 * empty state, or the paginated card feed — appending the next page on scroll.
 * each card opens that record's own detail screen.
 *
 * the feed can also be searched. two queries drive it rather than one: the
 * unfiltered feed, which is the resting screen and is also where the searchable
 * field names come from, and a search that only runs while there is a settled
 * query to run it for. Both render through the same list, so a match pages,
 * fails, and reads exactly as an unfiltered record does — and the header
 * carrying the field stays put through every one of a search's own states, so
 * the query that produced them can always be edited or cleared.
 */
export function CollectionRecordsScreen({
	slug,
}: Readonly<{ slug: string }>): JSX.Element {
	const { theme } = useUnistyles();
	const session = useAuthSession();
	const [query, setQuery] = useState("");
	const [isHeaderCollapsed, setHeaderCollapsed] = useState(false);
	const scrollOffset = useRef(0);
	const settledQuery = useDebouncedValue(query.trim(), SEARCH_DEBOUNCE_MS);
	const isSearching = settledQuery.length > 0;
	const userId = session?.user.id ?? "";

	const feed = useInfiniteQuery({
		...getCollectionRecordsInfiniteQueryOptions({ userId, slug }),
		enabled: session !== null,
	});

	// which fields this collection can be asked about, read off the records it
	// already returned — Payload reports no field configuration, and refuses a
	// query naming a field a collection does not have.
	const searchableFields = feed.data?.pages[0]?.searchableFields ?? [];

	const matches = useInfiniteQuery({
		...getCollectionRecordsInfiniteQueryOptions({
			userId,
			slug,
			search: { query: settledQuery, fields: searchableFields },
		}),
		enabled: session !== null && isSearching,
		// hold the last query's matches while the next one is in flight, so the
		// feed does not blank between two settled keystrokes.
		placeholderData: keepPreviousData,
	});

	/**
	 * the shared load-failure surface, for whichever of the two queries failed.
	 * `style` is what gives it the whole screen; a failure drawn inside the list
	 * takes only its own padding and passes none.
	 */
	const loadErrorState = (
		error: unknown,
		onRetry: () => void,
		style?: StyleProp<ViewStyle>,
	): JSX.Element => {
		const copy = describeLoadError(error, RECORDS_LOAD_ERROR);

		return (
			<CollectionsMessageState
				action={
					copy.retryable
						? {
								label: "Try again",
								onPress: onRetry,
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
				style={style}
				subtitle={copy.subtitle}
				testID="collection-records-error"
				title={copy.title}
			/>
		);
	};

	/**
	 * shrinks the search section while the reader scrolls down through the feed
	 * and restores it on the way back up. the last offset is a ref rather than
	 * state: it is read to decide a direction and never drawn, so writing it must
	 * not cost a render on every scroll frame.
	 */
	const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
		const offset = event.nativeEvent.contentOffset.y;
		const travelled = offset - scrollOffset.current;

		if (Math.abs(travelled) < SCROLL_DIRECTION_THRESHOLD) {
			return;
		}

		scrollOffset.current = offset;
		setHeaderCollapsed(travelled > 0 && offset > SCROLL_COLLAPSE_AFTER);
	};

	const offlineCopy = describeOfflineLoad(RECORDS_OFFLINE_SUBTITLE);
	const offlineState = (style?: StyleProp<ViewStyle>): JSX.Element => (
		<CollectionsMessageState
			icon={offlineCopy.icon}
			iconColor={theme.colors.text.neutral.base}
			status={offlineCopy.status}
			style={style}
			subtitle={offlineCopy.subtitle}
			testID="collection-records-offline"
			title={offlineCopy.title}
		/>
	);

	let content: JSX.Element;
	// ahead of the skeleton on purpose. with no connection the first page pauses
	// rather than failing, so the query stays `pending` with nothing cached and
	// the skeleton below would pulse indefinitely with nothing on its way. a feed
	// that already holds records is past `pending` and keeps showing them.
	if (feed.isPending && feed.fetchStatus === "paused") {
		content = offlineState(styles.messageState);
	} else if (feed.isPending) {
		content = <CollectionRecordsSkeleton />;
	} else if (feed.isError) {
		content = loadErrorState(
			feed.error,
			() => void feed.refetch(),
			styles.messageState,
		);
	} else {
		const records = feed.data.pages.flatMap((page) => page.records);

		if (records.length === 0) {
			// no search field either: an empty collection has nothing to search, and
			// offering to search it would be an affordance with one answer.
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
			const matchPages = matches.data?.pages;
			const active = isSearching ? matches : feed;

			// an errored search shows what failed rather than the matches of the
			// query before it, which `keepPreviousData` would otherwise leave
			// standing underneath the failure.
			//
			// the matches are deduplicated by id on the way out. a record found by
			// the id lookup leads the first page, and the field search can return
			// that same record again on a later page — it is only checked against
			// the page it was prepended to (see `toRecordPage`). offset pagination
			// can repeat a record across pages by itself too, when the collection
			// is written to mid-scroll. neither is worth a request to rule out, and
			// both draw the same duplicate row.
			let listed = records;
			if (isSearching) {
				listed =
					matches.isError || matchPages === undefined
						? []
						: dedupeById(matchPages.flatMap((page) => page.records));
			}

			// what the count line reports. a search still in flight says so; one
			// that failed leaves the line out, the failure below being what a
			// reader needs from that line's place instead.
			let count: RecordCount | undefined = {
				kind: "all",
				total: feed.data.pages[0]?.totalDocs ?? records.length,
			};
			if (isSearching) {
				const total = matchPages?.[0]?.totalDocs;
				count = matches.isError
					? undefined
					: total === undefined
						? { kind: "searching" }
						: { kind: "matches", total };
			}

			// what a search puts where the cards would be, when it has none to show.
			// each of these takes the rest of the screen below the section rather
			// than riding inside the list: `MessageState` carries the horizontal
			// safe-area inset for every call site on the understanding that it is
			// drawn flush against the screen's edges, so nesting one inside the
			// feed's already-inset content container would land that inset a gutter
			// in from the edge it is measured from and draw the card at both
			// paddings at once. `null` for the unfiltered feed, which reaches this
			// branch with records in hand.
			let searchState: JSX.Element | null = null;
			if (isSearching && matches.isError) {
				searchState = loadErrorState(
					matches.error,
					() => void matches.refetch(),
					styles.messageState,
				);
			} else if (
				isSearching &&
				matchPages === undefined &&
				matches.fetchStatus === "paused"
			) {
				// a search needs the server, so one made with no connection says what
				// the first load would have said rather than spinning forever.
				searchState = offlineState(styles.messageState);
			} else if (isSearching && matchPages === undefined) {
				searchState = (
					<ActivityIndicator
						color={theme.colors.text.neutral.base}
						style={styles.searching}
						testID="collection-records-searching"
					/>
				);
			} else if (isSearching && listed.length === 0) {
				searchState = (
					<CollectionsMessageState
						action={{
							label: "Clear search",
							onPress: () => setQuery(""),
							testID: "collection-records-clear-search-button",
						}}
						icon={SearchX}
						iconColor={theme.colors.text.neutral.base}
						style={styles.messageState}
						subtitle={`No records match “${settledQuery}”.`}
						testID="collection-records-no-matches"
						title="No matches"
					/>
				);
			}

			// the section is a sibling of the feed rather than its list header,
			// which is what fixes it under the screen header instead of letting it
			// scroll away with the first card. whatever a search has instead of
			// cards is a sibling of both, for the inset reason above.
			content = (
				<>
					<CollectionRecordsHeader
						collapsed={isHeaderCollapsed}
						count={count}
						onChangeQuery={setQuery}
						query={query}
					/>

					{searchState ?? (
						<FlatList
							contentContainerStyle={styles.list}
							data={listed}
							keyExtractor={(record: CollectionRecord) => record.id}
							ListFooterComponent={
								active.isFetchingNextPage ? (
									<ActivityIndicator
										color={theme.colors.text.neutral.base}
										style={styles.footer}
									/>
								) : null
							}
							onEndReached={() => {
								if (active.hasNextPage && !active.isFetchingNextPage) {
									void active.fetchNextPage();
								}
							}}
							onEndReachedThreshold={0.5}
							onScroll={handleScroll}
							renderItem={({ item }) => (
								<CollectionRecordCard record={item} slug={slug} />
							)}
							scrollEventThrottle={16}
							testID="collection-records-list"
						/>
					)}
				</>
			);
		}
	}

	return (
		<View style={styles.root} testID="collection-records-screen">
			{content}
		</View>
	);
}

/**
 * the records in order, keeping the first of any id that appears more than
 * once. see the call site for the two ways a search can produce one.
 *
 * the count beside the field is the server's own and is left alone, so a search
 * that did repeat a record reports one more match than it lists. That is the
 * lesser of the two: the number is off by one in a case a reader is unlikely to
 * notice, where the duplicate row is not.
 */
function dedupeById(records: readonly CollectionRecord[]): CollectionRecord[] {
	return [...new Map(records.map((record) => [record.id, record])).values()];
}

const styles = StyleSheet.create((theme, rt) => ({
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
	// the message state claims no space of its own, so every call site here
	// supplies the fill — the screen's own terminal states and the search's
	// alike, since both take the whole surface below whatever chrome is above
	// them.
	messageState: {
		flex: 1,
	},
	root: {
		flex: 1,
		backgroundColor: theme.colors.foundation.neutral.bare,
	},
	// a spinner rather than the card skeleton: the section above it already says
	// what is being waited on, and a skeleton in the shape of records would
	// promise matches that may not exist. it sits near the top of the room it is
	// given rather than centred in it, so it appears where the first card would.
	searching: {
		paddingTop: theme.gap.xl,
	},
}));
