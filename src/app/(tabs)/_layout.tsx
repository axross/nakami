import { NativeTabs } from "expo-router/unstable-native-tabs";
import type { JSX } from "react";
import { useUnistyles } from "react-native-unistyles";
import { useAuthStatus } from "~/auth/stores/auth-store";

export default function TabsLayout(): JSX.Element {
	const { theme } = useUnistyles();
	const status = useAuthStatus();

	return (
		<NativeTabs tintColor={theme.colors.accent}>
			<NativeTabs.Trigger name="index" testID="tab-home">
				<NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
				<NativeTabs.Trigger.Icon md="home" sf="house" />
			</NativeTabs.Trigger>

			{status === "authenticated" ? (
				<NativeTabs.Trigger name="collections" testID="tab-collections">
					<NativeTabs.Trigger.Label>Collections</NativeTabs.Trigger.Label>
					<NativeTabs.Trigger.Icon
						md="collections_bookmark"
						sf="square.stack"
					/>
				</NativeTabs.Trigger>
			) : null}

			<NativeTabs.Trigger name="settings" testID="tab-settings">
				<NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
				<NativeTabs.Trigger.Icon md="settings" sf="gearshape" />
			</NativeTabs.Trigger>
		</NativeTabs>
	);
}
