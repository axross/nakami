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
				<Stack.Screen name="[slug]/[recordId]/index" />
				{/* the field editor is a sheet over the record rather than another
				    card on the stack: the record stays visible above it, which is
				    what says the edit belongs to the record still on screen.

				    it draws its own header inside the sheet — Cancel, the field's
				    label, Save — so the navigator's is hidden rather than left to
				    repeat the label above a second one. `gestureEnabled` is left to
				    the screen, which turns the drag off while there is an unsaved
				    edit to lose; see `useDiscardGuard` there for why that is the
				    mechanism rather than a prevented dismissal. */}
				<Stack.Screen
					name="[slug]/[recordId]/[fieldName]"
					options={{
						headerShown: false,
						presentation: "formSheet",
						// one detent rather than a ladder: there is one thing on this
						// sheet and it wants the room, and the fraction is what leaves
						// the record recognisable above it.
						sheetAllowedDetents: [0.85],
						sheetCornerRadius: theme.radius.lg,
						sheetGrabberVisible: true,
					}}
				/>
			</Stack>
		</PendingWriteProvider>
	);
}
