import type { ComponentProps, JSX } from "react";
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
	action,
	...props
}: Readonly<
	Omit<ComponentProps<typeof MessageState>, "action"> & {
		action?: MessageAction;
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
