import type {
	PendingWriteState,
	PendingWriteTarget,
} from "~/collections/helpers/pending-write-queue";

/** what one field of one record currently shows, once the queue is taken into account. */
export interface FieldPendingState {
	/** the field's change has not reached the server yet. */
	readonly isQueued: boolean;
	/** what the server said about a refused save, and `null` when none was. */
	readonly refusalMessage: string | null;
	/**
	 * the value to show and to open an editor on. it is **derived rather than
	 * held**, which is what lets the row and the dialog agree about one field
	 * without passing text between them, and what keeps a refusal correctable
	 * after the dialog that produced it has closed.
	 */
	readonly value: unknown;
}

/**
 * resolves what a field shows from the queue's state and the record's own value.
 *
 * the order is the whole of it, and each step is more recent than the one after
 * it: the value the server **refused** is the last thing the user wrote, so it
 * wins; a value still **queued** is what they wrote before that and has not been
 * judged yet; the **record's** own value is what the server last accepted. Read
 * the other way round, a reopened editor would seed the value the edit replaced
 * and the correction would have to be retyped from nothing.
 *
 * a refusal and a queued change never coexist for one field — queueing clears
 * the refusal — so the first two cases are exclusive in practice. the order is
 * written out anyway rather than resting on that: this function would otherwise
 * be correct only for as long as the queue keeps a rule stated somewhere else.
 */
export function resolveFieldPendingState(
	state: PendingWriteState,
	target: PendingWriteTarget,
	recordValue: unknown,
): FieldPendingState {
	const refusal = state.refusals.find((entry) =>
		isSameField(entry.target, target),
	);
	const queued = state.writes.find((write) => isSameField(write, target));

	if (refusal !== undefined) {
		return {
			isQueued: false,
			refusalMessage: refusal.message,
			value: refusal.value,
		};
	}

	if (queued !== undefined) {
		return { isQueued: true, refusalMessage: null, value: queued.value };
	}

	return { isQueued: false, refusalMessage: null, value: recordValue };
}

function isSameField(a: PendingWriteTarget, b: PendingWriteTarget): boolean {
	return (
		a.slug === b.slug &&
		a.recordId === b.recordId &&
		a.fieldName === b.fieldName
	);
}
