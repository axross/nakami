import "~/unistyles";

import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import type { JSX } from "react";
import {
	initializeErrorReporter,
	wrapRootComponent,
} from "~/core/helpers/error-reporting";
import { queryClient } from "~/core/helpers/query-client";

initializeErrorReporter();

function RootLayout(): JSX.Element {
	return (
		<QueryClientProvider client={queryClient}>
			<Stack screenOptions={{ headerShown: false }} />
			<StatusBar style="auto" />
		</QueryClientProvider>
	);
}

export default wrapRootComponent(RootLayout);
