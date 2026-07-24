import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Tabs } from "expo-router";
import type { JSX } from "react";
import { useUnistyles } from "react-native-unistyles";

export default function TabsLayout(): JSX.Element {
	const { theme } = useUnistyles();

	// Standard JS tabs (React Navigation bottom tabs via expo-router's `Tabs`),
	// NOT expo-router's `unstable-native-tabs`: the experimental native
	// Fragment-backed tab host crashes on Android's New Architecture
	// (react-native-screens). The tab group is only mounted while authenticated
	// (the root navigator gates it), so the three-tab set is fixed.
	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarActiveTintColor: theme.colors.text.accent.base,
				tabBarInactiveTintColor: theme.colors.text.neutral.base,
				tabBarStyle: {
					backgroundColor: theme.colors.foundation.neutral.subtle,
					borderTopColor: theme.colors.border.neutral.subtle,
				},
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: "Home",
					tabBarButtonTestID: "tab-home",
					tabBarIcon: ({ color, size }) => (
						<MaterialCommunityIcons
							color={color}
							name="home-outline"
							size={size}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="collections"
				options={{
					title: "Collections",
					tabBarButtonTestID: "tab-collections",
					tabBarIcon: ({ color, size }) => (
						<MaterialCommunityIcons
							color={color}
							name="folder-multiple-outline"
							size={size}
						/>
					),
				}}
			/>
			<Tabs.Screen
				name="settings"
				options={{
					title: "Settings",
					tabBarButtonTestID: "tab-settings",
					tabBarIcon: ({ color, size }) => (
						<MaterialCommunityIcons
							color={color}
							name="cog-outline"
							size={size}
						/>
					),
				}}
			/>
		</Tabs>
	);
}
