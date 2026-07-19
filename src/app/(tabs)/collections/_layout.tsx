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
					backgroundColor: theme.colors.backgroundElevated,
				},
				headerTitleStyle: {
					color: theme.colors.textPrimary,
				},
			}}
		>
			<Stack.Screen name="index" options={{ title: "Collections" }} />
		</Stack>
	);
}
