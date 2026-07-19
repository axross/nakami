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
					backgroundColor: theme.colors.backgroundElevated,
				},
				headerTintColor: theme.colors.accent,
				headerTitleStyle: {
					color: theme.colors.textPrimary,
				},
			}}
		>
			<Stack.Screen name="index" options={{ title: "Settings" }} />
			<Stack.Screen name="licenses" options={{ title: "Licenses" }} />
		</Stack>
	);
}
