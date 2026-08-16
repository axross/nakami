import { type LucideIcon, WifiOff } from "lucide-react-native";

/** User-facing copy for a collections-domain load waiting on a connection. */
export interface OfflineLoadCopy {
	readonly title: string;
	readonly subtitle: string;
	/** The live line beneath the subtitle, e.g. "Waiting for a connection". */
	readonly status: string;
	readonly icon: LucideIcon;
}

/**
 * Describes a first load that is paused for want of a connection, shared by the
 * Collections list and the records list so both state it identically. Only the
 * subject-specific subtitle differs between callers — the same split
 * `describeLoadError` makes for a thrown failure.
 *
 * This is deliberately not part of that mapper: it maps a thrown error, and a
 * paused query has thrown nothing. The surface carries no action for the same
 * reason it carries a status line — retrying while the device is offline only
 * pauses the query again, and the load resumes on its own once the connection
 * returns.
 *
 * @param subtitle The subject-specific body, e.g. "Collections will load as
 *   soon as you're back online."
 */
export function describeOfflineLoad(subtitle: string): OfflineLoadCopy {
	return {
		title: "You're offline",
		subtitle,
		status: "Waiting for a connection",
		icon: WifiOff,
	};
}
