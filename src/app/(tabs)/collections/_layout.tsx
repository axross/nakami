import { Stack } from "expo-router";
import type { JSX } from "react";
import { useUnistyles } from "react-native-unistyles";

export default function CollectionsLayout(): JSX.Element {
	const { theme } = useUnistyles();

	return (
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
			<Stack.Screen name="[slug]" />
		</Stack>
	);
}
