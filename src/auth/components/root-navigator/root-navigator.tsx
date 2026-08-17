import { Stack } from "expo-router";
import type { JSX } from "react";
import { useUnistyles } from "react-native-unistyles";
import { useAuthStatus } from "~/auth/stores/auth-store";

/**
 * the auth-gated root navigator. authenticated, it mounts the tab UI; signed
 * out (or still resolving behind the splash), it mounts the single non-tab
 * welcome screen and the sign-in screen that welcome pushes.
 *
 * gating the whole tab group behind auth keeps the tab UI authenticated-only —
 * the signed-out experience is a dedicated welcome screen rather than a tab bar
 * with gated screens. exported for the auth-gate test.
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
						headerStyle: {
							backgroundColor: theme.colors.foundation.neutral.subtle,
						},
						headerTintColor: theme.colors.text.accent.base,
						headerTitleStyle: { color: theme.colors.text.neutral.intense },
					}}
				/>
			</Stack.Protected>
		</Stack>
	);
}
