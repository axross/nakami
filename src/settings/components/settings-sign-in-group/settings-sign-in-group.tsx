import { Link } from "expo-router";
import { LogIn } from "lucide-react-native";
import type { JSX } from "react";
import { SettingMenuGroup } from "~/settings/components/setting-menu-group/setting-menu-group";
import { SettingMenuGroupBody } from "~/settings/components/setting-menu-group/setting-menu-group-body";
import { SettingMenuGroupHeading } from "~/settings/components/setting-menu-group/setting-menu-group-heading";
import { SettingMenuGroupItem } from "~/settings/components/setting-menu-group/setting-menu-group-item";
import { SettingMenuGroupItemChevron } from "~/settings/components/setting-menu-group/setting-menu-group-item-chevron";
import { SettingMenuGroupItemIcon } from "~/settings/components/setting-menu-group/setting-menu-group-item-icon";
import { SettingMenuGroupItemLabel } from "~/settings/components/setting-menu-group/setting-menu-group-item-label";

/**
 * The signed-out Account section: a single Sign in row that opens the sign-in
 * screen. Rendered in place of the signed-in Account group while unauthenticated
 * (the parent gates it), so a user who lands on Settings first still has a way
 * in — mirroring the Home empty state's call to action.
 */
export function SettingsSignInGroup(): JSX.Element {
	return (
		<SettingMenuGroup>
			<SettingMenuGroupHeading>Account</SettingMenuGroupHeading>

			<SettingMenuGroupBody>
				<Link asChild href="/sign-in">
					<SettingMenuGroupItem
						accessibilityRole="link"
						first
						last
						testID="settings-sign-in-button"
					>
						<SettingMenuGroupItemIcon icon={LogIn} />
						<SettingMenuGroupItemLabel>Sign in</SettingMenuGroupItemLabel>
						<SettingMenuGroupItemChevron />
					</SettingMenuGroupItem>
				</Link>
			</SettingMenuGroupBody>
		</SettingMenuGroup>
	);
}
