import { NativeTabs } from "expo-router/unstable-native-tabs";
import type { JSX } from "react";
import { useUnistyles } from "react-native-unistyles";

export default function TabsLayout(): JSX.Element {
	const { theme } = useUnistyles();

	// The tab group is only mounted while authenticated (the root navigator gates
	// it), so the tab set is fixed here — all three triggers, unconditionally.
	// Never toggle a trigger on auth state: Expo's native tabs remount the
	// navigator when their visible set changes while mounted, which crashes
	// on-device on Android.
	return (
		<NativeTabs tintColor={theme.colors.accent}>
			<NativeTabs.Trigger name="index" testID="tab-home">
				<NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
				<NativeTabs.Trigger.Icon md="home" sf="house" />
			</NativeTabs.Trigger>

			<NativeTabs.Trigger name="collections" testID="tab-collections">
				<NativeTabs.Trigger.Label>Collections</NativeTabs.Trigger.Label>
				<NativeTabs.Trigger.Icon md="collections_bookmark" sf="square.stack" />
			</NativeTabs.Trigger>

			<NativeTabs.Trigger name="settings" testID="tab-settings">
				<NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
				<NativeTabs.Trigger.Icon md="settings" sf="gearshape" />
			</NativeTabs.Trigger>
		</NativeTabs>
	);
}
