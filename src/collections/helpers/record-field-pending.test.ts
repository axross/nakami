import { describe, expect, it } from "@jest/globals";
import type {
	PendingWriteState,
	PendingWriteTarget,
} from "~/collections/helpers/pending-write-queue";
import { resolveFieldPendingState } from "./record-field-pending";

const TARGET: PendingWriteTarget = {
	slug: "posts",
	recordId: "a1",
	fieldName: "body",
};

const EMPTY: PendingWriteState = { writes: [], refusals: [] };

function stateWith(overrides: Partial<PendingWriteState>): PendingWriteState {
	return { ...EMPTY, ...overrides };
}

describe("resolveFieldPendingState()", () => {
	it("falls back to the record's own value when the queue holds nothing", () => {
		expect(resolveFieldPendingState(EMPTY, TARGET, "Saved")).toEqual({
			isQueued: false,
			refusalMessage: null,
			value: "Saved",
		});
	});

	it("prefers a queued change, and says the field is not saved yet", () => {
		const state = stateWith({ writes: [{ ...TARGET, value: "Queued" }] });

		expect(resolveFieldPendingState(state, TARGET, "Saved")).toEqual({
			isQueued: true,
			refusalMessage: null,
			value: "Queued",
		});
	});

	// the whole reason the queue keeps the refused value. an editor reopened on
	// the record's value would silently discard what the user wrote and leave the
	// message pinned over a value nothing is wrong with.
	it("prefers a refused value, and carries what the server said", () => {
		const state = stateWith({
			refusals: [
				{ target: TARGET, message: "This field is required.", value: "" },
			],
		});

		expect(resolveFieldPendingState(state, TARGET, "Saved")).toEqual({
			isQueued: false,
			refusalMessage: "This field is required.",
			value: "",
		});
	});

	// the queue clears a field's refusal when it queues a change for it, so the
	// two never coexist in practice. the order is asserted anyway rather than
	// resting on a rule stated in another module.
	it("prefers the refusal over a queued change if it ever saw both", () => {
		const state = stateWith({
			writes: [{ ...TARGET, value: "Queued" }],
			refusals: [{ target: TARGET, message: "Refused.", value: "Refused" }],
		});

		expect(resolveFieldPendingState(state, TARGET, "Saved").value).toBe(
			"Refused",
		);
	});

	it.each<[string, Partial<PendingWriteTarget>]>([
		["another collection", { slug: "pages" }],
		["another record", { recordId: "b2" }],
		["another field", { fieldName: "title" }],
	])("ignores a change belonging to %s", (_, difference) => {
		const state = stateWith({
			writes: [{ ...TARGET, ...difference, value: "Elsewhere" }],
			refusals: [
				{
					target: { ...TARGET, ...difference },
					message: "Refused.",
					value: "Elsewhere",
				},
			],
		});

		expect(resolveFieldPendingState(state, TARGET, "Saved")).toEqual({
			isQueued: false,
			refusalMessage: null,
			value: "Saved",
		});
	});

	// `null` and `undefined` are values a field can genuinely hold, so the
	// resolution has to be by presence in the queue rather than by truthiness.
	it("carries a queued null through rather than reading it as nothing queued", () => {
		const state = stateWith({ writes: [{ ...TARGET, value: null }] });

		expect(resolveFieldPendingState(state, TARGET, "Saved")).toEqual({
			isQueued: true,
			refusalMessage: null,
			value: null,
		});
	});
});
