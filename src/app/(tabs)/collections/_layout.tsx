import { Stack } from "expo-router";
import type { JSX } from "react";
import { useUnistyles } from "react-native-unistyles";
import { PendingWriteProvider } from "~/collections/components/pending-write-provider/pending-write-provider";

/**
 * the Collections stack, and the one place the pending-write queue is mounted.
 *
 * it wraps the navigator rather than sitting inside a screen, because a change
 * has to outlive the screen that made it: leaving a record while its edit is
 * still queued must not drop the edit. the stack is also as far as it goes —
 * the queue belongs to this feature, and nothing outside it has anything to
 * put in one.
 */
export default function CollectionsLayout(): JSX.Element {
	const { theme } = useUnistyles();

	return (
		<PendingWriteProvider>
			<Stack
				screenOptions={{
					headerShown: true,
					headerStyle: {
						backgroundColor: theme.colors.foundation.neutral.subtle,
					},
					headerTitleStyle: {
						color: theme.colors.text.neutral.intense,
					},
				}}
			>
				<Stack.Screen name="index" options={{ title: "Collections" }} />
				<Stack.Screen name="[slug]/index" />
				<Stack.Screen name="[slug]/[recordId]" />
			</Stack>
		</PendingWriteProvider>
	);
}
