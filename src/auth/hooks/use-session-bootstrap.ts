import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { useAuthStore } from "~/auth/stores/auth-store";

/**
 * Drives launch-time auth: runs {@link useAuthStore.hydrate} once and hides the
 * native splash screen as soon as auth status settles, so the splash stays up
 * across the keychain read and the `/me` verification and the app never flashes
 * an incorrect auth state.
 *
 * The matching `SplashScreen.preventAutoHideAsync()` call lives at the root
 * layout's module scope, per Expo's guidance to invoke it before render.
 */
export function useSessionBootstrap(): void {
	const hydrate = useAuthStore((state) => state.hydrate);
	const status = useAuthStore((state) => state.status);

	useEffect(() => {
		void hydrate();
	}, [hydrate]);

	useEffect(() => {
		if (status !== "loading") {
			void SplashScreen.hideAsync();
		}
	}, [status]);
}
