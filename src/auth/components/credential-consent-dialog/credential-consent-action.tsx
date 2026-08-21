import type { ComponentPropsWithRef, JSX } from "react";
import { Pressable, Text } from "react-native";
import { StyleSheet } from "react-native-unistyles";

/**
 * one of the dialog's two answers. both are this part, at the same height and
 * the same width, and the difference between them is a fill rather than a
 * demotion — declining is never a faint text link under a button, which is the
 * shape that turns a consent prompt into a nudge.
 *
 * `variant` selects that fill. neither value implies a recommendation: the
 * accent one marks which answer the dialog is *about*, the way a form's submit
 * does, and the dialog opens with no answer selected either way.
 */
export function CredentialConsentAction({
	disabled = false,
	label,
	variant,
	...props
}: Readonly<
	Omit<
		ComponentPropsWithRef<typeof Pressable>,
		"children" | "disabled" | "style"
	> & {
		// narrowed from `Pressable`'s own `boolean | null | undefined`, so the
		// default below covers every value that is not `true` — a `null` would
		// otherwise slip past it and reach `accessibilityState`.
		disabled?: boolean;
		label: string;
		variant: "accent" | "neutral";
	}
>): JSX.Element {
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityState={{ disabled }}
			disabled={disabled}
			{...props}
			style={({ pressed }) => [
				styles.action,
				variant === "accent" ? styles.actionAccent : styles.actionNeutral,
				disabled && styles.actionDisabled,
				pressed && styles.actionPressed,
			]}
		>
			<Text
				style={[
					styles.label,
					variant === "accent" ? styles.labelAccent : styles.labelNeutral,
				]}
			>
				{label}
			</Text>
		</Pressable>
	);
}

const styles = StyleSheet.create((theme) => ({
	// 50 matches the sign-in form's submit button, which is what keeps this
	// dialog reading as the last step of that form rather than as a surface from
	// somewhere else. it clears both platforms' touch-target floors on its own.
	action: {
		alignItems: "center",
		borderRadius: theme.radius.md,
		borderWidth: theme.borderWidth.hairline,
		justifyContent: "center",
		minHeight: 50,
		paddingHorizontal: theme.gap.sm,
	},
	actionAccent: {
		backgroundColor: theme.colors.solid.accent.base,
		borderColor: theme.colors.solid.accent.base,
	},
	// only ever set while the answer already given is being written, which is
	// imperceptible unless the keychain refuses it.
	actionDisabled: {
		opacity: 0.5,
	},
	actionNeutral: {
		backgroundColor: theme.colors.surface.neutral.base,
		borderColor: theme.colors.border.neutral.base,
	},
	actionPressed: {
		opacity: 0.6,
	},
	label: {
		...theme.typography.heading,
		textAlign: "center",
	},
	labelAccent: {
		color: theme.colors.text.onAccent,
	},
	labelNeutral: {
		color: theme.colors.text.neutral.intense,
	},
}));
