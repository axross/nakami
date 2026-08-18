// the ladder's rungs, in elapsed milliseconds. a month is a fixed 30 days
// rather than a calendar one, so the boundary the absolute date takes over at
// needs no month-length arithmetic and never varies between records.
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;

const MONTHS = [
	"Jan",
	"Feb",
	"Mar",
	"Apr",
	"May",
	"Jun",
	"Jul",
	"Aug",
	"Sep",
	"Oct",
	"Nov",
	"Dec",
] as const;

/**
 * validates a record's `updatedAt` and returns it as epoch milliseconds, or
 * `null` when the value is absent or is not a date string `Date` can parse. a
 * non-string is rejected rather than coerced, the same way the title heuristic
 * skips a field of the wrong type.
 */
export function parseUpdatedAt(value: unknown): number | null {
	if (typeof value !== "string") {
		return null;
	}

	const time = new Date(value).getTime();

	return Number.isNaN(time) ? null : time;
}

// "1 hour ago" / "5 hours ago" — the plural comes off the count, so no rung
// needs a branch of its own to read singular.
function agoLabel(count: number, unit: string): string {
	return `${count} ${unit}${count === 1 ? "" : "s"} ago`;
}

/**
 * formats a record's last update into the label its card shows: a relative one
 * — "Just now", "12 minutes ago", "Yesterday", "3 weeks ago" — for anything
 * updated within the last 30 days, and the short "18 Jul 2026" date past that.
 *
 * both parameters are epoch milliseconds, and `now` is one of them rather than
 * a `Date.now()` read inside, so every rung's boundary is testable without a
 * frozen clock. the relative rungs come from elapsed time and the absolute date
 * from UTC parts, so the same record reads the same on every device — no `Intl`
 * and no device-timezone dependence. a timestamp ahead of the device clock is
 * skew rather than information, so it takes the newest rung.
 */
export function formatUpdatedAt(updatedAt: number, now: number): string {
	const elapsed = now - updatedAt;

	if (elapsed < MINUTE) {
		return "Just now";
	}

	if (elapsed < HOUR) {
		return agoLabel(Math.floor(elapsed / MINUTE), "minute");
	}

	if (elapsed < DAY) {
		return agoLabel(Math.floor(elapsed / HOUR), "hour");
	}

	if (elapsed < 2 * DAY) {
		return "Yesterday";
	}

	if (elapsed < WEEK) {
		return agoLabel(Math.floor(elapsed / DAY), "day");
	}

	if (elapsed < MONTH) {
		return agoLabel(Math.floor(elapsed / WEEK), "week");
	}

	const date = new Date(updatedAt);

	return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}
