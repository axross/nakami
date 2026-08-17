import { useEffect } from "react";
import { AppState } from "react-native";
import { refreshSessionIfDue } from "~/auth/helpers/session-refresh";
import { useAuthStore } from "~/auth/stores/auth-store";

// how often, while authenticated and foregrounded, to check whether the token
// has entered its refresh window. the check itself is cheap and only issues a
// network call when a refresh is actually due.
const REFRESH_CHECK_INTERVAL_MS = 5 * 60 * 1000;

/**
 * keeps the session token fresh while authenticated: checks on mount, on every
 * return to the foreground, and on a periodic timer, refreshing only when the
 * token is due. tears down its timer and listener on sign-out/unmount.
 */
export function useSessionRefresh(): void {
	const status = useAuthStore((state) => state.status);

	useEffect(() => {
		if (status !== "authenticated") {
			return;
		}

		const check = (): void => {
			void refreshSessionIfDue();
		};

		check();
		const interval = setInterval(check, REFRESH_CHECK_INTERVAL_MS);
		const subscription = AppState.addEventListener("change", (next) => {
			if (next === "active") {
				check();
			}
		});

		return () => {
			clearInterval(interval);
			subscription.remove();
		};
	}, [status]);
}
