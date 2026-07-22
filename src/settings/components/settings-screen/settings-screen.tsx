import { showFeedbackWidget } from "@sentry/react-native";
import { nativeApplicationVersion, nativeBuildVersion } from "expo-application";
import { openMenu as openDevMenu } from "expo-dev-client";
import { Link } from "expo-router";
import { FileText, MessageSquare, SquareTerminal } from "lucide-react-native";
import { type JSX, useCallback } from "react";
import { Platform, ScrollView, Text } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { useAuthStatus } from "~/auth/stores/auth-store";
import { SettingMenuGroup } from "~/settings/components/setting-menu-group/setting-menu-group";
import { SettingMenuGroupBody } from "~/settings/components/setting-menu-group/setting-menu-group-body";
import { SettingMenuGroupHeading } from "~/settings/components/setting-menu-group/setting-menu-group-heading";
import { SettingMenuGroupItem } from "~/settings/components/setting-menu-group/setting-menu-group-item";
import { SettingMenuGroupItemChevron } from "~/settings/components/setting-menu-group/setting-menu-group-item-chevron";
import { SettingMenuGroupItemIcon } from "~/settings/components/setting-menu-group/setting-menu-group-item-icon";
import { SettingMenuGroupItemLabel } from "~/settings/components/setting-menu-group/setting-menu-group-item-label";
import { SettingsAccountGroup } from "~/settings/components/settings-account-group/settings-account-group";
import { SettingsSignInGroup } from "~/settings/components/settings-sign-in-group/settings-sign-in-group";
import { getCommitHash } from "~/settings/helpers/commit-hash";

const technicalInfo = [
	`Version: ${nativeApplicationVersion}`,
	`Build: ${nativeBuildVersion}`,
	`SHA: ${getCommitHash()}`,
];

export function SettingsScreen(): JSX.Element {
	const status = useAuthStatus();

	const onFeedbackPress = useCallback(() => {
		showFeedbackWidget();
	}, []);

	const onOpenDevMenuPress = useCallback(() => {
		openDevMenu();
	}, []);

	return (
		<ScrollView
			contentContainerStyle={styles.content}
			style={styles.root}
			testID="settings-screen"
		>
			{status === "authenticated" ? (
				<SettingsAccountGroup />
			) : (
				<SettingsSignInGroup />
			)}

			<SettingMenuGroup>
				<SettingMenuGroupHeading>About</SettingMenuGroupHeading>

				<SettingMenuGroupBody>
					<SettingMenuGroupItem
						accessibilityRole="button"
						first
						onPress={onFeedbackPress}
						testID="settings-feedback-row"
					>
						<SettingMenuGroupItemIcon icon={MessageSquare} />
						<SettingMenuGroupItemLabel>Feedback</SettingMenuGroupItemLabel>
						<SettingMenuGroupItemChevron />
					</SettingMenuGroupItem>

					<Link asChild href="/(tabs)/settings/licenses">
						<SettingMenuGroupItem
							accessibilityRole="link"
							last
							testID="settings-license-row"
						>
							<SettingMenuGroupItemIcon icon={FileText} />
							<SettingMenuGroupItemLabel>License</SettingMenuGroupItemLabel>
							<SettingMenuGroupItemChevron />
						</SettingMenuGroupItem>
					</Link>
				</SettingMenuGroupBody>
			</SettingMenuGroup>

			{__DEV__ ? (
				<SettingMenuGroup>
					<SettingMenuGroupHeading>Debug</SettingMenuGroupHeading>

					<SettingMenuGroupBody>
						<SettingMenuGroupItem
							accessibilityRole="button"
							first
							last
							onPress={onOpenDevMenuPress}
							testID="settings-open-dev-menu-row"
						>
							<SettingMenuGroupItemIcon icon={SquareTerminal} />
							<SettingMenuGroupItemLabel>
								Open Dev Menu
							</SettingMenuGroupItemLabel>
						</SettingMenuGroupItem>
					</SettingMenuGroupBody>
				</SettingMenuGroup>
			) : null}

			<Text style={styles.technicalDetails} testID="settings-technical-details">
				{technicalInfo.join("\n")}
			</Text>

			<Text style={styles.disclaimer} testID="settings-disclaimer">
				Nakami is an independent, third-party client and is not affiliated with,
				endorsed by, or sponsored by Payload CMS, Inc. or Figma. Payload and
				related marks are trademarks of Payload CMS, Inc.
			</Text>
		</ScrollView>
	);
}

const styles = StyleSheet.create((theme) => ({
	content: {
		paddingTop: theme.gapSizes.x24,
		rowGap: theme.gapSizes.x24,
	},
	root: {
		backgroundColor: theme.colors.background,
		flex: 1,
	},
	technicalDetails: {
		color: theme.colors.textPrimary,
		fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }),
		fontSize: theme.fontSizes.sm,
		paddingHorizontal: theme.gapSizes.x16,
	},
	disclaimer: {
		color: theme.colors.textSecondary,
		fontSize: theme.fontSizes.sm,
		paddingHorizontal: theme.gapSizes.x16,
	},
}));
