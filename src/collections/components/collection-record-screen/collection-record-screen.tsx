import { onlineManager, useQuery } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { CircleAlert } from "lucide-react-native";
import type { JSX } from "react";
import { useEffect, useSyncExternalStore } from "react";
import { ScrollView, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { useAuthSession } from "~/auth/stores/auth-store";
import { CollectionRecordFieldRow } from "~/collections/components/collection-record-field-row/collection-record-field-row";
import { CollectionRecordOfflineNotice } from "~/collections/components/collection-record-screen/collection-record-offline-notice";
import { CollectionRecordSkeleton } from "~/collections/components/collection-record-skeleton/collection-record-skeleton";
import { CollectionsMessageState } from "~/collections/components/collections-message-state/collections-message-state";
import {
	usePendingWriteQueue,
	usePendingWriteState,
} from "~/collections/components/pending-write-provider/pending-write-provider";
import { deriveRecordTitle } from "~/collections/helpers/derive-record-title";
import { describeLoadError } from "~/collections/helpers/describe-collections-error";
import { describeOfflineLoad } from "~/collections/helpers/describe-collections-offline";
import { toRecordFields } from "~/collections/helpers/record-fields";
import { getCollectionAccessQueryOptions } from "~/collections/queries/collection-access-query";
import { getCollectionRecordQueryOptions } from "~/collections/queries/collection-record-query";

// subject nouns for the shared load-error mapper (the taxonomy — icon, tone,
// retryability — is shared with the collection list and the record feed).
const RECORD_LOAD_ERROR = {
	accessTitle: "Can't access this record",
	accessSubtitle: "Your account doesn't have permission to view this record.",
	genericSubtitle:
		"Something went wrong loading this record. Please try again.",
} as const;

// what a route carrying no usable slug or record id says. it is deliberately
// not run through `describeLoadError`: that mapper describes a request that
// failed, and no request was ever built from a route addressing no record. its
// generic copy would also end by asking for a retry this surface does not
// offer — the one thing a screen with no action must not do. a record card
// always pushes both halves, so a link into the app is the only way to reach
// this, which is why the copy names one.
const RECORD_UNADDRESSED = {
	title: "Couldn't open this link",
	subtitle: "It doesn't point to a record.",
} as const;

// the subject-specific half of the offline surface; its title, status line, and
// icon are shared with the two lists.
const RECORD_OFFLINE_SUBTITLE =
	"This record will load as soon as you're back online.";

/** the stack header's title before the record that names it has arrived. */
const PENDING_TITLE = "Record";

// both declared at module scope rather than inline, because
// `useSyncExternalStore` re-subscribes whenever the subscribe function's
// identity changes — an arrow written in the hook body would tear the
// subscription down and build it again on every render.
const subscribeToOnline = (onStoreChange: () => void): (() => void) =>
	onlineManager.subscribe(onStoreChange);
const getIsOnline = (): boolean => onlineManager.isOnline();

/**
 * whether the device can currently reach the server, read from the
 * `onlineManager` the query client drives from `expo-network`.
 *
 * the pending-write queue's own trigger reads the same *source* through a
 * subscription of its own rather than through that manager, so that it does not
 * depend on the query layer being mounted. the two therefore agree about what
 * "offline" means and can still differ for the moment it takes both to observe
 * one change — which costs at most a notice that appears or clears a beat
 * before or after the queue starts holding changes back.
 */
function useIsOnline(): boolean {
	return useSyncExternalStore(subscribeToOnline, getIsOnline, getIsOnline);
}

/**
 * one record's fields: the screen a record card opens. renders an offline
 * state, a loading skeleton, a failure-aware error state (permission failures
 * get calm, retry-less copy; connectivity and unexpected failures offer a
 * retry; a route naming no record gets copy of its own and no action at all),
 * or the field list — one row per key in the record's own JSON, in the order
 * the server returned them, with `id` first.
 *
 * two queries feed it, and both are needed before a row can be drawn: the
 * record supplies the fields and their values, and the collection's access map
 * supplies whether each may be saved. they share the list screens' own cache
 * entries, so a record opened from the feed usually has the access map already.
 *
 * every save goes through the pending-write queue rather than straight to the
 * server, which is what lets an edit be made with no connection and what keeps
 * two saves on one record from interleaving. the screen never awaits one: it
 * hands the change to the queue and lets the queue's published state mark the
 * row.
 */
export function CollectionRecordScreen({
	recordId,
	slug,
}: Readonly<{ recordId: string; slug: string }>): JSX.Element {
	const { theme } = useUnistyles();
	const session = useAuthSession();
	const queue = usePendingWriteQueue();
	const { writes, refusals } = usePendingWriteState();
	const isOnline = useIsOnline();

	// a route missing either half addresses no record, so nothing is asked of the
	// server: no request built from it could succeed, and one fired anyway would
	// reach the error tracker as a server fault rather than the bad link it is.
	const hasTarget = slug.length > 0 && recordId.length > 0;
	const scope = {
		userId: session?.user.id ?? "",
		slug,
		recordId,
	};
	const enabled = session !== null && hasTarget;

	// the queue is mounted on the Collections stack and outlives this screen, but
	// a refusal is about a value that leaves with it: the input that held the
	// rejected text is gone, and a row reopened from the cached record seeds the
	// last good value instead. leaving the refusal behind would put "Refused" and
	// a message about an emptied field over that perfectly valid value. what is
	// still queued is untouched — it is owed to the server either way.
	useEffect(() => {
		return () => {
			queue.clearRefusals({ slug, recordId });
		};
	}, [queue, slug, recordId]);

	const recordQuery = useQuery({
		...getCollectionRecordQueryOptions(scope),
		enabled,
	});
	const accessQuery = useQuery({
		...getCollectionAccessQueryOptions({ userId: scope.userId }),
		enabled,
	});

	const record = recordQuery.data;
	const access = accessQuery.data;
	const error = recordQuery.error ?? accessQuery.error;
	const isPending = recordQuery.isPending || accessQuery.isPending;
	// with no connection a first fetch pauses rather than failing, so the query
	// stays `pending` with nothing cached — and the skeleton below would pulse
	// indefinitely with nothing on its way.
	const isPaused =
		(recordQuery.isPending && recordQuery.fetchStatus === "paused") ||
		(accessQuery.isPending && accessQuery.fetchStatus === "paused");

	function retry(): void {
		void recordQuery.refetch();
		void accessQuery.refetch();
	}

	function save(fieldName: string, value: unknown): void {
		// deliberately not awaited: the caller is a blur handler, and the send is
		// the one thing it must not wait on. the outcome arrives through the
		// queue's published state, which marks the row.
		void queue.enqueue({ slug, recordId, fieldName, value });
	}

	let content: JSX.Element;
	// tracks the branch below rather than the data, so the offline notice appears
	// with the fields and never over a surface already saying the same thing.
	let isShowingFields = false;
	if (hasTarget && isPaused) {
		const copy = describeOfflineLoad(RECORD_OFFLINE_SUBTITLE);
		content = (
			<CollectionsMessageState
				icon={copy.icon}
				iconColor={theme.colors.text.neutral.base}
				status={copy.status}
				style={styles.messageState}
				subtitle={copy.subtitle}
				testID="collection-record-offline"
				title={copy.title}
			/>
		);
	} else if (!hasTarget) {
		// a route that addresses no record is the one failure a retry cannot fix:
		// there is nothing to load again, and pressing a button would change
		// nothing. it therefore carries no action — and, unlike the branch below,
		// no copy asking for one.
		content = (
			<CollectionsMessageState
				icon={CircleAlert}
				iconColor={theme.colors.text.destructive.base}
				style={styles.messageState}
				subtitle={RECORD_UNADDRESSED.subtitle}
				testID="collection-record-error"
				title={RECORD_UNADDRESSED.title}
			/>
		);
	} else if (error !== null) {
		const copy = describeLoadError(error, RECORD_LOAD_ERROR);
		content = (
			<CollectionsMessageState
				action={
					copy.retryable
						? {
								label: "Try again",
								onPress: retry,
								testID: "collection-record-retry-button",
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
				testID="collection-record-error"
				title={copy.title}
			/>
		);
	} else if (isPending || record === undefined || access === undefined) {
		content = <CollectionRecordSkeleton />;
	} else {
		const fields = toRecordFields({ slug, record, access });
		isShowingFields = true;

		content = (
			<ScrollView
				contentContainerStyle={styles.fields}
				// a form of stacked inputs: a tap moving from one to the next has to
				// reach the input it landed on rather than only dismissing the
				// keyboard, which is what the default would do.
				keyboardShouldPersistTaps="handled"
				testID="collection-record-fields"
			>
				{fields.map((field) => (
					<CollectionRecordFieldRow
						field={field}
						isQueued={writes.some(
							(write) =>
								write.slug === slug &&
								write.recordId === recordId &&
								write.fieldName === field.name,
						)}
						key={field.name}
						onSave={save}
						refusalMessage={
							refusals.find(
								({ target }) =>
									target.slug === slug &&
									target.recordId === recordId &&
									target.fieldName === field.name,
							)?.message ?? null
						}
					/>
				))}
			</ScrollView>
		);
	}

	return (
		<View style={styles.root} testID="collection-record-screen">
			<Stack.Screen
				options={{
					title:
						record === undefined
							? PENDING_TITLE
							: deriveRecordTitle(record).title,
				}}
			/>
			{/* the record is on screen and editable with no connection, so the
			    notice sits above it rather than replacing it. it is not shown while
			    the load path is already saying the same thing. */}
			{!isOnline && isShowingFields ? <CollectionRecordOfflineNotice /> : null}
			{content}
		</View>
	);
}

const styles = StyleSheet.create((theme, rt) => ({
	// a stack header clears the top edge and the tab bar the bottom, so this
	// screen owns only the horizontal pair — carried on the scrolling content
	// container, not on the scroll view itself, which would inset its scroll
	// indicators and leave the controls stopping short of the screen edge.
	// `CollectionRecordSkeleton` mirrors these values, or the fields would shift
	// when the record arrives.
	fields: {
		rowGap: theme.gap.lg,
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
