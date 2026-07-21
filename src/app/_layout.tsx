import "~/unistyles";

import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import type { JSX } from "react";
import { useUnistyles } from "react-native-unistyles";
import { useSessionBootstrap } from "~/auth/hooks/use-session-bootstrap";
import { useSessionRefresh } from "~/auth/hooks/use-session-refresh";
import {
	initializeErrorReporter,
	wrapRootComponent,
} from "~/core/helpers/error-reporting";
import { queryClient } from "~/core/helpers/query-client";

initializeErrorReporter();

// Hold the native splash screen until launch-time auth status settles; the
// bootstrap hook hides it once `/me` verification resolves.
void SplashScreen.preventAutoHideAsync();

function RootLayout(): JSX.Element {
	const { theme } = useUnistyles();

	useSessionBootstrap();
	useSessionRefresh();

	return (
		<QueryClientProvider client={queryClient}>
			<Stack screenOptions={{ headerShown: false }}>
				<Stack.Screen name="(tabs)" />
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
			</Stack>
			<StatusBar style="auto" />
		</QueryClientProvider>
	);
}

export default wrapRootComponent(RootLayout);
