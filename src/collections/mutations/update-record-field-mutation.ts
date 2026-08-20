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
 * mutation options for writing one field of one record. consume with
 * `useMutation(getUpdateRecordFieldMutationOptions(scope))` and fire it with
 * the field a control just finished editing; the server URL and token are read
 * fresh from the session inside the `mutationFn`.
 *
 * `scope` is the per-record serialiser: two blurs in quick succession on the
 * same record queue behind one another instead of racing, so the later write
 * cannot land before the earlier one. writes to *different* records stay
 * parallel, which is why the id is built from the record's own key.
 *
 * a save that lands patches the saved field into the cached record through
 * {@link setCachedRecordField}, and nothing is invalidated or refetched: a
 * refetch would replace what is sitting in the screen's other inputs while they
 * are still being edited. the raw error is surfaced unwrapped so the row can
 * show the server's message beneath the value the user typed.
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
	const mutationKey = [
		...getSessionQueryKeyRoot(scope.userId),
		"collections",
		scope.slug,
		"records",
		scope.recordId,
		"update",
	];

	return mutationOptions({
		mutationKey,
		scope: { id: mutationKey.join("/") },
		mutationFn: async ({
			fieldName,
			value,
		}: UpdateRecordFieldInput): Promise<void> => {
			// a mutation factory holds no hooks: read the session imperatively.
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
