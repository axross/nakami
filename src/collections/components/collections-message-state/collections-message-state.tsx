import type { LucideIcon } from "lucide-react-native";
import type { JSX } from "react";
import { Pressable, Text } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { CollectionsMessageStateStatus } from "~/collections/components/collections-message-state/collections-message-state-status";
import { MessageState } from "~/common/components/message-state/message-state";

interface MessageAction {
	readonly label: string;
	readonly onPress: () => void;
	readonly testID?: string;
}

/**
 * The Collections screen's empty, error, and offline surfaces: the shared
 * {@link MessageState} with a primary retry button when an action is given, and
 * a pulsing status line when a status label is. The status line's own test hook
 * is derived from this surface's, so a test targets the two by related names.
 */
export function CollectionsMessageState({
	icon,
	iconColor,
	title,
	subtitle,
	status,
	action,
	testID,
}: Readonly<{
	icon: LucideIcon;
	iconColor?: string;
	title: string;
	subtitle: string;
	status?: string;
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
			status={
				status ? (
					<CollectionsMessageStateStatus
						label={status}
						testID={testID ? `${testID}-status` : undefined}
					/>
				) : undefined
			}
			subtitle={subtitle}
			testID={testID}
			title={title}
		/>
	);
}

const styles = StyleSheet.create((theme) => ({
	button: (pressed: boolean) => ({
		alignItems: "center",
		backgroundColor: theme.colors.solid.accent.base,
		borderRadius: theme.gap.sm,
		justifyContent: "center",
		marginTop: theme.gap.md,
		minHeight: 48,
		opacity: pressed ? 0.7 : 1,
		paddingHorizontal: theme.gap.lg,
	}),
	buttonLabel: {
		...theme.typography.heading,
		color: theme.colors.text.onAccent,
	},
}));
