import { describe, expect, it } from "@jest/globals";
import { formatUpdatedAt, parseUpdatedAt } from "./format-updated-at";

const SECOND = 1_000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// a fixed "now" rather than the clock the run happens to start at, so each
// rung's boundary is asserted at an exact elapsed time and no fake timer is
// needed.
const NOW = Date.UTC(2026, 7, 18, 12, 0, 0);

/** the label a record updated `elapsed` ms before {@link NOW} reads as. */
function labelAfter(elapsed: number): string {
	return formatUpdatedAt(NOW - elapsed, NOW);
}

describe("parseUpdatedAt", () => {
	it("reads an ISO date string as epoch milliseconds", () => {
		expect(parseUpdatedAt("2026-07-18T12:34:56.000Z")).toBe(
			Date.UTC(2026, 6, 18, 12, 34, 56),
		);
	});

	it("returns null for a missing or non-string value", () => {
		expect(parseUpdatedAt(undefined)).toBeNull();
		expect(parseUpdatedAt(1_700_000_000)).toBeNull();
	});

	it("returns null for an unparseable date string", () => {
		expect(parseUpdatedAt("not-a-date")).toBeNull();
	});
});

describe("formatUpdatedAt", () => {
	// each rung is asserted on both sides of the boundary below it, because an
	// off-by-one comparison reads plausibly at every point except there.
	it("reads 'Just now' under a minute", () => {
		expect(labelAfter(0)).toBe("Just now");
		expect(labelAfter(59 * SECOND)).toBe("Just now");
	});

	it("reads in whole minutes from a minute to an hour", () => {
		expect(labelAfter(MINUTE)).toBe("1 minute ago");
		expect(labelAfter(12 * MINUTE)).toBe("12 minutes ago");
		expect(labelAfter(59 * MINUTE + 59 * SECOND)).toBe("59 minutes ago");
	});

	it("reads in whole hours from an hour to a day", () => {
		expect(labelAfter(HOUR)).toBe("1 hour ago");
		expect(labelAfter(5 * HOUR)).toBe("5 hours ago");
		expect(labelAfter(23 * HOUR + 59 * MINUTE)).toBe("23 hours ago");
	});

	// "Yesterday" is elapsed time, not the previous calendar day, so it covers
	// the whole 24-to-48-hour band and "1 day ago" is unreachable.
	it("reads 'Yesterday' from 24 to 48 hours", () => {
		expect(labelAfter(DAY)).toBe("Yesterday");
		expect(labelAfter(2 * DAY - SECOND)).toBe("Yesterday");
	});

	it("reads in whole days from 48 hours to a week", () => {
		expect(labelAfter(2 * DAY)).toBe("2 days ago");
		expect(labelAfter(6 * DAY)).toBe("6 days ago");
		expect(labelAfter(7 * DAY - SECOND)).toBe("6 days ago");
	});

	it("reads in whole weeks from a week to 30 days", () => {
		expect(labelAfter(7 * DAY)).toBe("1 week ago");
		expect(labelAfter(21 * DAY)).toBe("3 weeks ago");
		expect(labelAfter(29 * DAY)).toBe("4 weeks ago");
	});

	// past 30 days the label stops moving, so it becomes the date itself —
	// formatted from UTC parts and with no "Updated" prefix.
	it("reads as a short UTC date at 30 days and beyond", () => {
		expect(labelAfter(30 * DAY)).toBe("19 Jul 2026");

		const updatedAt = Date.UTC(2026, 6, 18, 12, 34, 56);
		expect(formatUpdatedAt(updatedAt, updatedAt + 400 * DAY)).toBe(
			"18 Jul 2026",
		);
	});

	// a record updated "after" now is device clock skew rather than information
	// about the record, so it takes the newest rung instead of a negative one.
	it("reads a future timestamp as 'Just now'", () => {
		expect(labelAfter(-5 * HOUR)).toBe("Just now");
	});
});
