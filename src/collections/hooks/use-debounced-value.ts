import { useEffect, useState } from "react";

/**
 * follows `value`, but only once it has stopped changing for `delayMs`.
 *
 * what it is for is the gap between what someone is typing and what is worth
 * asking a server about: the input stays on every keystroke, and the request is
 * made for the text they settled on. The first value is taken immediately —
 * there is nothing to wait out on mount — and each change after that restarts
 * the wait, so a burst of keystrokes costs one update rather than one each.
 *
 * a value that changes back to what the hook already reports settles to the
 * same thing, so a query typed, deleted, and retyped inside the delay never
 * moves.
 */
export function useDebouncedValue<Value>(value: Value, delayMs: number): Value {
	const [settled, setSettled] = useState(value);

	useEffect(() => {
		if (Object.is(value, settled)) {
			return;
		}

		const timeout = setTimeout(() => setSettled(value), delayMs);

		return () => clearTimeout(timeout);
	}, [value, settled, delayMs]);

	return settled;
}
