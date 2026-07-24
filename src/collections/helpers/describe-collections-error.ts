import { CircleAlert, Lock, type LucideIcon } from "lucide-react-native";
import { PayloadRequestError } from "~/common/helpers/payload-client";

/** User-facing copy and presentation for a collections-domain load failure. */
export interface LoadErrorCopy {
	readonly title: string;
	readonly subtitle: string;
	readonly icon: LucideIcon;
	readonly tone: "danger" | "muted";
	readonly retryable: boolean;
}

/**
 * The subject-specific copy a caller supplies for a permission failure and an
 * unexpected failure. The connectivity message is shared (it is about the
 * server, not the resource), so it is not part of the subject.
 */
export interface LoadErrorSubject {
	/** Permission-failure title, e.g. "Can't access collections". */
	readonly accessTitle: string;
	/** Permission-failure body, e.g. "Your account doesn't have permission…". */
	readonly accessSubtitle: string;
	/** Unexpected-failure body, e.g. "Something went wrong loading collections…". */
	readonly genericSubtitle: string;
}

/**
 * Maps a load failure to user-facing copy, shared by the Collections list and
 * the records list so both map failures identically. A permission failure is an
 * expected account/config state, so it gets a distinct, non-alarming message and
 * no retry (retrying can't grant access); connectivity and unexpected failures
 * offer a retry. Only the subject nouns differ between callers.
 */
export function describeLoadError(
	error: unknown,
	subject: LoadErrorSubject,
): LoadErrorCopy {
	if (error instanceof PayloadRequestError && error.kind === "auth") {
		return {
			title: subject.accessTitle,
			subtitle: subject.accessSubtitle,
			icon: Lock,
			tone: "muted",
			retryable: false,
		};
	}

	if (error instanceof PayloadRequestError && error.kind === "network") {
		return {
			title: "Couldn't load",
			subtitle:
				"We couldn't reach the server. Check your connection and try again.",
			icon: CircleAlert,
			tone: "danger",
			retryable: true,
		};
	}

	return {
		title: "Couldn't load",
		subtitle: subject.genericSubtitle,
		icon: CircleAlert,
		tone: "danger",
		retryable: true,
	};
}
