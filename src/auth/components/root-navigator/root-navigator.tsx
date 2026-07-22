import { Stack } from "expo-router";
import type { JSX } from "react";
import { useUnistyles } from "react-native-unistyles";
import { useAuthStatus } from "~/auth/stores/auth-store";

/**
 * The auth-gated root navigator. Authenticated, it mounts the tab UI; signed
 * out (or still resolving behind the splash), it mounts the single non-tab
 * welcome screen and the sign-in screen that welcome pushes.
 *
 * Gating the whole tab group behind auth — rather than toggling one tab's
 * visibility — keeps the native tab bar mounted only ever with its full, static
 * set, never reconfigured in place. That is what avoids the on-device
 * post-authentication crash: Expo's native tabs remount the navigator when
 * their visible set changes while mounted (which crashes on Android).
 */
export function RootNavigator(): JSX.Element {
	const { theme } = useUnistyles();
	const status = useAuthStatus();

	return (
		<Stack screenOptions={{ headerShown: false }}>
			<Stack.Protected guard={status === "authenticated"}>
				<Stack.Screen name="(tabs)" />
			</Stack.Protected>

			<Stack.Protected guard={status !== "authenticated"}>
				<Stack.Screen name="welcome" />
				<Stack.Screen
					name="sign-in"
					options={{
						headerShown: true,
						title: "Sign in",
						headerStyle: { backgroundColor: theme.colors.backgroundElevated },
						headerTintColor: theme.colors.accent,
						headerTitleStyle: { color: theme.colors.textPrimary },
					}}
				/>
			</Stack.Protected>
		</Stack>
	);
}
