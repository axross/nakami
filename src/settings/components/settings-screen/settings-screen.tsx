import { showFeedbackWidget } from "@sentry/react-native";
import { nativeApplicationVersion, nativeBuildVersion } from "expo-application";
import { openMenu as openDevMenu } from "expo-dev-client";
import { Link } from "expo-router";
import { FileText, MessageSquare, SquareTerminal } from "lucide-react-native";
import { type JSX, useCallback } from "react";
import { ScrollView, Text } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { SettingMenuGroup } from "~/settings/components/setting-menu-group/setting-menu-group";
import { SettingMenuGroupBody } from "~/settings/components/setting-menu-group/setting-menu-group-body";
import { SettingMenuGroupHeading } from "~/settings/components/setting-menu-group/setting-menu-group-heading";
import { SettingMenuGroupItem } from "~/settings/components/setting-menu-group/setting-menu-group-item";
import { SettingMenuGroupItemChevron } from "~/settings/components/setting-menu-group/setting-menu-group-item-chevron";
import { SettingMenuGroupItemIcon } from "~/settings/components/setting-menu-group/setting-menu-group-item-icon";
import { SettingMenuGroupItemLabel } from "~/settings/components/setting-menu-group/setting-menu-group-item-label";
import { SettingsAccountGroup } from "~/settings/components/settings-account-group/settings-account-group";
import { getCommitHash } from "~/settings/helpers/commit-hash";

const technicalInfo = [
	`Version: ${nativeApplicationVersion}`,
	`Build: ${nativeBuildVersion}`,
	`SHA: ${getCommitHash()}`,
];

export function SettingsScreen(): JSX.Element {
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
			<SettingsAccountGroup />

			<SettingMenuGroup>
				<SettingMenuGroupHeading>About</SettingMenuGroupHeading>

				<SettingMenuGroupBody>
					<SettingMenuGroupItem
						accessibilityRole="button"
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

const styles = StyleSheet.create((theme, rt) => ({
	// a stack header clears the top edge and the tab bar the bottom, so this
	// screen owns only the horizontal pair — carried on the scrolled content,
	// not on the `ScrollView`, which would inset its scroll indicators and leave
	// the rows stopping short of the screen edge.
	//
	// the horizontal value is the bare inset rather than `Math.max(inset,
	// gutter)`, which every other surface here uses: this container has no
	// horizontal gutter of its own. its children carry it — `SettingMenuGroupBody`,
	// `SettingMenuGroupHeading`, and the two paragraphs below each set
	// `paddingHorizontal: theme.gap.md` — so flooring the inset here would add a
	// second gutter on top of theirs.
	//
	// `paddingBottom` is new: without it the last row sat flush against the tab
	// bar.
	content: {
		rowGap: theme.gap.lg,
		paddingTop: theme.gap.lg,
		paddingBottom: theme.gap.lg,
		paddingStart: rt.insets.left,
		paddingEnd: rt.insets.right,
	},
	root: {
		flex: 1,
		backgroundColor: theme.colors.foundation.neutral.bare,
	},
	technicalDetails: {
		...theme.typography.code,
		paddingHorizontal: theme.gap.md,
		color: theme.colors.text.neutral.base,
	},
	disclaimer: {
		...theme.typography.caption,
		paddingHorizontal: theme.gap.md,
		color: theme.colors.text.neutral.base,
	},
}));
