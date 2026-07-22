import type { LucideIcon } from "lucide-react-native";
import type { JSX } from "react";
import { Pressable, Text } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { MessageState } from "~/common/components/message-state/message-state";

interface MessageAction {
	readonly label: string;
	readonly onPress: () => void;
	readonly testID?: string;
}

/**
 * The Collections screen's empty and error surfaces: the shared
 * {@link MessageState} with a primary retry button when an action is given.
 */
export function CollectionsMessageState({
	icon,
	iconColor,
	title,
	subtitle,
	action,
	testID,
}: Readonly<{
	icon: LucideIcon;
	iconColor?: string;
	title: string;
	subtitle: string;
	action?: MessageAction;
	testID?: string;
}>): JSX.Element {
	return (
		<MessageState
			action={
				action ? (
					<Pressable
						accessibilityRole="button"
						onPress={action.onPress}
						style={({ pressed }) => styles.button(pressed)}
						testID={action.testID}
					>
						<Text style={styles.buttonLabel}>{action.label}</Text>
					</Pressable>
				) : undefined
			}
			icon={icon}
			iconColor={iconColor}
			subtitle={subtitle}
			testID={testID}
			title={title}
		/>
	);
}

const styles = StyleSheet.create((theme) => ({
	button: (pressed: boolean) => ({
		alignItems: "center",
		backgroundColor: theme.colors.accent,
		borderRadius: theme.radiusSizes.md,
		justifyContent: "center",
		marginTop: theme.gapSizes.x16,
		minHeight: 48,
		opacity: pressed ? 0.7 : 1,
		paddingHorizontal: theme.gapSizes.x24,
	}),
	buttonLabel: {
		color: theme.colors.accentContrast,
		fontSize: theme.fontSizes.md,
		fontWeight: "600",
	},
}));
