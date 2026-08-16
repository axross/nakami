import "~/unistyles";

import { QueryClientProvider } from "@tanstack/react-query";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import type { JSX } from "react";
import { RootNavigator } from "~/auth/components/root-navigator/root-navigator";
import { useSessionBootstrap } from "~/auth/hooks/use-session-bootstrap";
import { useSessionRefresh } from "~/auth/hooks/use-session-refresh";
import {
	initializeErrorReporter,
	wrapRootComponent,
} from "~/core/helpers/error-reporting";
import { queryClient } from "~/core/helpers/query-client";

initializeErrorReporter();

// hold the native splash screen until launch-time auth status settles; the
// bootstrap hook hides it once `/me` verification resolves.
void SplashScreen.preventAutoHideAsync();

function RootLayout(): JSX.Element {
	useSessionBootstrap();
	useSessionRefresh();

	return (
		<QueryClientProvider client={queryClient}>
			<RootNavigator />
			<StatusBar style="auto" />
		</QueryClientProvider>
	);
}

export default wrapRootComponent(RootLayout);
