import { Stack } from "expo-router";
import type { JSX } from "react";
import { useUnistyles } from "react-native-unistyles";

export default function SettingsLayout(): JSX.Element {
	const { theme } = useUnistyles();

	return (
		<Stack
			screenOptions={{
				headerShown: true,
				headerStyle: {
					backgroundColor: theme.colors.foundation.neutral.subtle,
				},
				headerTintColor: theme.colors.text.accent.base,
				headerTitleStyle: {
					color: theme.colors.text.neutral.intense,
				},
			}}
		>
			<Stack.Screen name="index" options={{ title: "Settings" }} />
			<Stack.Screen name="licenses" options={{ title: "Licenses" }} />
		</Stack>
	);
}
