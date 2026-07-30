import { useMutation } from "@tanstack/react-query";
import { LogOut, UserRound } from "lucide-react-native";
import { type JSX, useCallback } from "react";
import { Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { getSignOutMutationOptions } from "~/auth/mutations/sign-out-mutation";
import { useAuthSession } from "~/auth/stores/auth-store";
import { SettingMenuGroup } from "~/settings/components/setting-menu-group/setting-menu-group";
import { SettingMenuGroupBody } from "~/settings/components/setting-menu-group/setting-menu-group-body";
import { SettingMenuGroupHeading } from "~/settings/components/setting-menu-group/setting-menu-group-heading";
import { SettingMenuGroupItem } from "~/settings/components/setting-menu-group/setting-menu-group-item";
import { SettingMenuGroupItemLabel } from "~/settings/components/setting-menu-group/setting-menu-group-item-label";
import { SettingMenuGroupStaticItem } from "~/settings/components/setting-menu-group/setting-menu-group-static-item";

/**
 * The signed-in Account section: the current user's email and server, plus a
 * Sign out action. Rendered only while authenticated (the parent gates it), so
 * the session is always present here.
 */
export function SettingsAccountGroup(): JSX.Element | null {
	const { theme } = useUnistyles();
	const session = useAuthSession();
	const { mutate: signOut, isPending } = useMutation(
		getSignOutMutationOptions(),
	);

	const onSignOutPress = useCallback(() => {
		signOut();
	}, [signOut]);

	if (session === null) {
		return null;
	}

	return (
		<SettingMenuGroup>
			<SettingMenuGroupHeading>Account</SettingMenuGroupHeading>

			<SettingMenuGroupBody>
				<SettingMenuGroupStaticItem testID="settings-account-row">
					<View style={styles.avatar}>
						<UserRound color={theme.colors.text.accent.base} size={22} />
					</View>
					<View style={styles.accountText}>
						<Text numberOfLines={1} style={styles.email}>
							{session.user.email}
						</Text>
						<Text numberOfLines={1} style={styles.server}>
							{session.serverUrl}
						</Text>
					</View>
				</SettingMenuGroupStaticItem>

				<SettingMenuGroupItem
					accessibilityRole="button"
					accessibilityState={{ disabled: isPending }}
					disabled={isPending}
					onPress={onSignOutPress}
					testID="settings-sign-out-row"
				>
					<LogOut color={theme.colors.text.destructive.base} size={24} />
					<SettingMenuGroupItemLabel style={styles.signOutLabel}>
						Sign out
					</SettingMenuGroupItemLabel>
				</SettingMenuGroupItem>
			</SettingMenuGroupBody>
		</SettingMenuGroup>
	);
}

const styles = StyleSheet.create((theme) => ({
	accountText: {
		flexShrink: 1,
		rowGap: theme.gap.xs,
	},
	avatar: {
		alignItems: "center",
		aspectRatio: 1,
		backgroundColor: theme.colors.surface.neutral.base,
		borderRadius: theme.gap.md,
		justifyContent: "center",
		width: 36,
	},
	email: {
		color: theme.colors.text.neutral.intense,
		fontFamily: theme.fonts.paragraph,
		fontSize: 16,
	},
	server: {
		color: theme.colors.text.neutral.base,
		fontFamily: theme.fonts.paragraph,
		fontSize: 13,
	},
	signOutLabel: {
		color: theme.colors.text.destructive.base,
	},
}));
