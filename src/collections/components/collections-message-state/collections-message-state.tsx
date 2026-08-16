import type { ComponentProps, JSX } from "react";
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
 *
 * `status` narrows the shared slot from a node to a label: every collections
 * status line is that one pulsing shape, and taking a node here would let a
 * caller put something else in it.
 */
export function CollectionsMessageState({
	action,
	status,
	testID,
	...props
}: Readonly<
	Omit<ComponentProps<typeof MessageState>, "action" | "status"> & {
		action?: MessageAction;
		status?: string;
	}
>): JSX.Element {
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
			status={
				status ? (
					<CollectionsMessageStateStatus
						label={status}
						testID={testID ? `${testID}-status` : undefined}
					/>
				) : undefined
			}
			testID={testID}
			{...props}
		/>
	);
}

const styles = StyleSheet.create((theme) => ({
	button: (pressed: boolean) => ({
		alignItems: "center",
		backgroundColor: theme.colors.solid.accent.base,
		borderRadius: theme.radius.md,
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
