import { mutationOptions, type QueryClient } from "@tanstack/react-query";
import { useAuthStore } from "~/auth/stores/auth-store";
import { updateRecordField } from "~/collections/helpers/update-record-field";
import {
	type CollectionRecordScope,
	setCachedRecordField,
} from "~/collections/queries/collection-record-query";
import { getSessionQueryKeyRoot } from "~/common/helpers/session-query-key";
import { createModuleLogger } from "~/core/helpers/logging";

const logger = createModuleLogger("collections/update-record-field-mutation");

/** the one field a save carries, and the value to write to it. */
export interface UpdateRecordFieldInput {
	readonly fieldName: string;
	readonly value: unknown;
}

/**
 * mutation options for writing one field of one record: the server write this
 * app's record screen performs, expressed as the mutation factory
 * docs/conventions/server-state.md requires of every server write.
 *
 * its one caller is the pending-write queue's sender, not a `useMutation` in a
 * row. a change made offline reaches the server from a drain, long after the
 * blur that queued it returned, so the component that fired it is often gone by
 * the time this runs — which is why the queue owns the send and this is built
 * imperatively against the mutation cache rather than observed by a hook.
 *
 * two options are deliberately set the way they are, and both exist because the
 * queue, not this library, owns the offline path here:
 *
 * - `networkMode: "always"` keeps the mutation from ever being *paused* for
 *   want of connectivity. TanStack's paused-mutation queue and this app's own
 *   queue would otherwise both hold the same change, and the queue awaits this
 *   call — a paused mutation never settles, so its mutex would be held forever.
 *   Always firing means the send either lands or fails with a verdict the queue
 *   can classify, which is the contract `drain()` is written against.
 * - no `scope`. `scope` is how this library serialises writes that would
 *   otherwise race, and the acceptance criterion it would serve — two saves for
 *   one record never interleaving — is already met by the queue's mutex, which
 *   holds across the whole drain rather than around one mutation. A second
 *   serialiser underneath it could only subtract: a scoped mutation left
 *   `pending` blocks every later one in the same scope, and the only thing that
 *   frees it is a mutation the queue would never get to send.
 *
 * a save that lands patches the saved field into the cached record through
 * {@link setCachedRecordField}, from `onSuccess` here rather than from the call
 * site, and nothing is invalidated or refetched: a refetch would replace what is
 * sitting in the screen's other inputs while they are still being edited. the
 * raw error is surfaced unwrapped so the queue can tell a change that was
 * refused from one that never got a verdict, and the row can show the server's
 * own message beneath the value the user typed.
 *
 * `queryClient` is a parameter rather than the app's own imported singleton, so
 * a test can drive this against a throwaway cache — which is what
 * docs/conventions/server-state.md requires of a test that needs a working
 * client.
 */
export function getUpdateRecordFieldMutationOptions(
	scope: CollectionRecordScope,
	queryClient: QueryClient,
) {
	return mutationOptions({
		mutationKey: [
			...getSessionQueryKeyRoot(scope.userId),
			"collections",
			scope.slug,
			"records",
			scope.recordId,
			"update",
		],
		networkMode: "always",
		mutationFn: async ({
			fieldName,
			value,
		}: UpdateRecordFieldInput): Promise<void> => {
			// a mutation factory holds no hooks: read the session imperatively, at
			// the moment the change is actually sent. a change queued offline is
			// sent by a later drain, and the token it goes out with is the one the
			// session holds then, not the one it held at the blur.
			const session = useAuthStore.getState().session;
			if (session === null) {
				throw new Error("Cannot save a field without a session.");
			}

			const startedAt = performance.now();
			// the slug and the field name are schema identifiers; the value is the
			// user's own content and never reaches a log line or a breadcrumb.
			logger.debug("Started saving a record field.", {
				slug: scope.slug,
				fieldName,
			});

			try {
				await updateRecordField(
					session.serverUrl,
					session.token,
					scope.slug,
					scope.recordId,
					fieldName,
					value,
				);
				logger.debug("Completed saving a record field.", {
					slug: scope.slug,
					fieldName,
					duration: performance.now() - startedAt,
				});
			} catch (error) {
				// close the bracket on the failure path so the breadcrumb trail
				// reaches the refusal the row is about to show.
				logger.warn("Failed saving a record field.", {
					slug: scope.slug,
					fieldName,
					duration: performance.now() - startedAt,
				});
				throw error;
			}
		},
		onSuccess: (_data, { fieldName, value }) => {
			setCachedRecordField(queryClient, scope, fieldName, value);
		},
	});
}
