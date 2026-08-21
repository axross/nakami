import { useQuery } from "@tanstack/react-query";
import { useNavigation, useRouter } from "expo-router";
import { CircleAlert } from "lucide-react-native";
import type { JSX, RefObject } from "react";
import { useEffect, useRef, useState } from "react";
import { Alert, Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { useAuthSession } from "~/auth/stores/auth-store";
import { CollectionFieldEditorHeader } from "~/collections/components/collection-field-editor-screen/collection-field-editor-header";
import { CollectionFieldEditorInput } from "~/collections/components/collection-field-editor-screen/collection-field-editor-input";
import { CollectionFieldError } from "~/collections/components/collection-field-error/collection-field-error";
import { CollectionsMessageState } from "~/collections/components/collections-message-state/collections-message-state";
import {
	usePendingWriteQueue,
	usePendingWriteState,
} from "~/collections/components/pending-write-provider/pending-write-provider";
import {
	parseEditorText,
	toEditorText,
} from "~/collections/helpers/record-field-display";
import { resolveFieldPendingState } from "~/collections/helpers/record-field-pending";
import {
	type DialogEditableField,
	isDialogEditable,
	toRecordFields,
} from "~/collections/helpers/record-fields";
import { getCollectionAccessQueryOptions } from "~/collections/queries/collection-access-query";
import { getCollectionRecordQueryOptions } from "~/collections/queries/collection-record-query";

/** what a route naming a field this record cannot offer an editor for says. */
const FIELD_UNAVAILABLE = {
	title: "Can't edit this field",
	subtitle: "This record has no field to edit here.",
	// a record that could not be loaded is a different fact, and saying the field
	// is missing would be a claim this screen cannot support: it never saw the
	// record to know.
	unloadableSubtitle: "This field couldn't be loaded.",
} as const;

/** what the editor says about text it cannot read back into a value. */
const UNPARSEABLE_JSON = "This isn't valid JSON, so it can't be saved yet.";

/** the discard confirmation, shown only when there is something to lose. */
const DISCARD_PROMPT = {
	title: "Discard changes?",
	message: "Your edit to this field won't be saved.",
	discard: "Discard",
	keep: "Keep editing",
} as const;

/**
 * one field's editor: the screen a record row's preview opens, presented as a
 * sheet over the record it belongs to.
 *
 * it reads the record and the access map from the **same query options the
 * record screen uses**, so opening it is a cache read rather than a second
 * fetch, and runs the same field mapper — which is what keeps the two screens
 * from disagreeing about whether a field is editable at all. A route naming a
 * field the record does not carry, or one that is not edited here, states so
 * and offers only a way back.
 *
 * the text is seeded **once**, from the value the queue resolves rather than
 * from the record: a change still on its way and one the server refused are both
 * more recent than what the record holds, and seeding from the record would
 * silently discard the user's own last words on the field.
 *
 * unlike every control on the record screen, this one does not commit on blur.
 * Save is the whole of committing, Cancel is the whole of discarding, and
 * leaving by any other route is routed through the same confirmation Cancel is —
 * see {@link useDiscardGuard}.
 */
export function CollectionFieldEditorScreen({
	fieldName,
	recordId,
	slug,
}: Readonly<{
	fieldName: string;
	recordId: string;
	slug: string;
}>): JSX.Element {
	const { theme } = useUnistyles();
	const router = useRouter();
	const session = useAuthSession();
	const queue = usePendingWriteQueue();
	const pendingWrites = usePendingWriteState();

	const hasTarget =
		slug.length > 0 && recordId.length > 0 && fieldName.length > 0;
	const enabled = session !== null && hasTarget;
	const scope = { userId: session?.user.id ?? "", slug, recordId };

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
	const field =
		record === undefined || access === undefined
			? undefined
			: toRecordFields({ slug, record, access }).find(
					(candidate) => candidate.name === fieldName,
				);
	// the editor opens for exactly the fields the row hands to it. a route naming
	// a read-only field, or one whose value fits a line, is not a state this app
	// can reach by tapping — it is a link, and it gets the same treatment an
	// unaddressed record does rather than an editor over a value it would send
	// back in the wrong shape.
	const editable =
		field !== undefined && isDialogEditable(field) ? field : undefined;
	const error = recordQuery.error ?? accessQuery.error;
	// with a target to load and no verdict yet, there is nothing true to say:
	// the field is not missing, it is not here yet. saying either would flash a
	// failure at anyone who opened this from a link rather than from the record,
	// which is the one path that arrives with nothing cached.
	const isResolving =
		enabled &&
		error === null &&
		(recordQuery.isPending || accessQuery.isPending);

	if (isResolving) {
		return (
			<View style={styles.root} testID="collection-field-editor-loading" />
		);
	}

	return editable === undefined ? (
		<View style={styles.root} testID="collection-field-editor-screen">
			<CollectionsMessageState
				action={{
					label: "Close",
					onPress: () => {
						router.back();
					},
					testID: "collection-field-editor-close-button",
				}}
				icon={CircleAlert}
				iconColor={theme.colors.text.destructive.base}
				style={styles.messageState}
				subtitle={
					error === null
						? FIELD_UNAVAILABLE.subtitle
						: FIELD_UNAVAILABLE.unloadableSubtitle
				}
				testID="collection-field-editor-unavailable"
				title={FIELD_UNAVAILABLE.title}
			/>
		</View>
	) : (
		// keyed on the field, so a sheet reopened for a different field seeds from
		// that field's value rather than keeping the last one's text.
		<CollectionFieldEditorForm
			field={editable}
			key={`${slug}/${recordId}/${editable.name}`}
			onSave={(value) => {
				// deliberately not awaited, exactly as a row's blur is: the outcome
				// arrives through the queue's published state, which marks the row
				// this sheet is closing back onto.
				void queue.enqueue({ slug, recordId, fieldName, value });
			}}
			seededValue={
				resolveFieldPendingState(
					pendingWrites,
					{ slug, recordId, fieldName },
					editable.value,
				).value
			}
		/>
	);
}

/**
 * the editor once there is a field to edit. it is a component of its own so the
 * seeding, the dirty tracking, and the discard guard can be state rather than
 * conditionals — none of them mean anything until the field has resolved, and a
 * hook cannot be called only once it has.
 */
function CollectionFieldEditorForm({
	field,
	onSave,
	seededValue,
}: Readonly<{
	field: DialogEditableField;
	onSave: (value: unknown) => void;
	seededValue: unknown;
}>): JSX.Element {
	const router = useRouter();
	const [seededText] = useState(() => toEditorText(field.kind, seededValue));
	const [text, setText] = useState(seededText);
	const [problem, setProblem] = useState<string | null>(null);
	// what Save committed, so the discard guard lets that navigation through
	// rather than asking about text the user has just chosen to keep. a ref
	// because the guard reads it when the navigation happens, not when the render
	// that set it commits.
	const hasCommittedRef = useRef(false);
	const isDirty = text !== seededText;

	useDiscardGuard(isDirty, hasCommittedRef);

	function save(): void {
		// unchanged text sends nothing, matching the record screen's own rule that
		// leaving an input that was not changed sends nothing.
		if (text !== seededText) {
			const parsed = parseEditorText(field.kind, text);

			// text that cannot be read back is not sent: the server answers 200 to a
			// value of the wrong type and stores `null`, so nothing downstream could
			// report the loss. the sheet stays open on the text that caused it.
			if (parsed === null) {
				setProblem(UNPARSEABLE_JSON);

				return;
			}

			onSave(parsed.value);
		}

		hasCommittedRef.current = true;
		router.back();
	}

	return (
		<View style={styles.root} testID="collection-field-editor-screen">
			<CollectionFieldEditorHeader
				label={field.label}
				onCancel={() => {
					router.back();
				}}
				onSave={save}
			/>
			<View style={styles.body} testID="collection-field-editor-body">
				{/* the Payload name, as the row's own label line shows it — the label
				    is in the header above, and this is the other half of naming the
				    field being edited. */}
				<Text style={styles.name}>{field.name}</Text>
				<CollectionFieldEditorInput
					accessibilityLabel={field.label}
					isFlagged={problem !== null}
					kind={field.kind}
					onChangeText={(next) => {
						setText(next);
						// the message describes text that has since been retyped, so it
						// goes the moment the text moves rather than at the next save.
						setProblem(null);
					}}
					testID="collection-field-editor-input"
					value={text}
				/>
				{problem === null ? null : (
					<CollectionFieldError
						message={problem}
						testID="collection-field-editor-error"
					/>
				)}
			</View>
		</View>
	);
}

/**
 * keeps an edit from being lost by any route out of the sheet.
 *
 * two mechanisms, because one does not cover both ways out. A **JS-driven**
 * departure — Cancel, the Android back button, anything dispatching a
 * navigation — fires `beforeRemove`, which is prevented and answered with the
 * confirmation. A **native** one, the drag that dismisses a sheet on iOS, never
 * reaches JS in time to be prevented: React Navigation drives the underlying
 * `preventNativeDismiss` from its prevent-remove context, and the only thing
 * that writes to that context is `usePreventRemove`, which `expo-router` vendors
 * but does not re-export. Adding a bare `beforeRemove` listener does not set it.
 *
 * so the drag is disabled instead, and only while there is something to lose:
 * `gestureEnabled` follows the edit's dirtiness, which is what a sheet holding
 * unsaved content does natively anyway. With nothing typed the drag dismisses as
 * it should; with something typed it stops working and Cancel is the way out,
 * which asks. A dismissal can therefore never silently discard an edit — which
 * is the promise — though the gesture answers by not moving rather than by
 * asking, which the header's own controls do.
 */
function useDiscardGuard(
	isDirty: boolean,
	hasCommittedRef: RefObject<boolean>,
): void {
	const navigation = useNavigation();

	useEffect(() => {
		navigation.setOptions({ gestureEnabled: !isDirty });
	}, [navigation, isDirty]);

	useEffect(() => {
		return navigation.addListener("beforeRemove", (event) => {
			// the committed flag is read **here**, when the departure happens, and
			// not folded into `isDirty` above. Save sets it and navigates in the same
			// tick, before React has re-rendered anything, so a listener registered
			// against a dirtiness computed at render time would still be the dirty
			// one — and pressing Save would ask whether to discard the text the user
			// had just chosen to keep.
			if (!isDirty || hasCommittedRef.current) {
				return;
			}

			event.preventDefault();

			Alert.alert(DISCARD_PROMPT.title, DISCARD_PROMPT.message, [
				{ style: "cancel", text: DISCARD_PROMPT.keep },
				{
					onPress: () => {
						navigation.dispatch(event.data.action);
					},
					style: "destructive",
					text: DISCARD_PROMPT.discard,
				},
			]);
		});
	}, [navigation, isDirty, hasCommittedRef]);
}

const styles = StyleSheet.create((theme, rt) => ({
	// the editor and its message, beneath the header. the horizontal gutter is
	// the record screen's own, so the two surfaces line up where the sheet sits
	// over the record.
	body: {
		flex: 1,
		rowGap: theme.gap.xs,
		paddingBottom: Math.max(rt.insets.bottom, theme.gap.md),
		paddingStart: Math.max(rt.insets.left, theme.gap.md),
		paddingEnd: Math.max(rt.insets.right, theme.gap.md),
	},
	messageState: {
		flex: 1,
	},
	name: {
		...theme.typography.codeCaption,
		color: theme.colors.text.neutral.base,
	},
	// the sheet is presented over the record and draws no header of its own, so
	// it owns its bottom and horizontal edges. the top is the sheet's own
	// presentation, which is inset from the status bar by the platform.
	root: {
		flex: 1,
		backgroundColor: theme.colors.foundation.neutral.bare,
	},
}));
