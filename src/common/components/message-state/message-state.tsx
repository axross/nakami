import type { LucideIcon } from "lucide-react-native";
import type { ComponentPropsWithoutRef, JSX, ReactNode } from "react";
import { Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

/**
 * A centered "mark + title + subtitle" surface with an optional action slot —
 * the shared shape behind feature empty/error/placeholder screens (Home's
 * connect prompt, the Collections empty/error/detail states). Callers pass
 * their own action element so each keeps its distinct control (a navigation
 * link, a retry button).
 *
 * The root claims no space of its own: a consumer that gives it a whole screen
 * passes `flex: 1` through `style`.
 */
export function MessageState({
	icon: Icon,
	iconColor,
	title,
	subtitle,
	action,
	style,
	...props
}: Readonly<
	Omit<ComponentPropsWithoutRef<typeof View>, "children"> & {
		icon: LucideIcon;
		iconColor?: string;
		title: string;
		subtitle: string;
		action?: ReactNode;
	}
>): JSX.Element {
	const { theme } = useUnistyles();

	return (
		<View {...props} style={[styles.root, style]}>
			<View style={styles.mark}>
				<Icon color={iconColor ?? theme.colors.text.accent.base} size={34} />
			</View>

			<Text style={styles.title}>{title}</Text>
			<Text style={styles.subtitle}>{subtitle}</Text>

			{action}
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	mark: {
		alignItems: "center",
		aspectRatio: 1,
		backgroundColor: theme.colors.foundation.neutral.subtle,
		borderRadius: theme.gap.md,
		justifyContent: "center",
		marginBottom: theme.gap.xs,
		width: 66,
	},
	// Deliberately no fill here: how much room the surface gets is the consumer's
	// half of the split, so do not "fix" this by adding one.
	root: {
		alignItems: "center",
		backgroundColor: theme.colors.foundation.neutral.bare,
		justifyContent: "center",
		padding: theme.gap.lg,
		rowGap: theme.gap.xs,
	},
	subtitle: {
		...theme.typography.body,
		color: theme.colors.text.neutral.base,
		maxWidth: 280,
		textAlign: "center",
	},
	title: {
		...theme.typography.title,
		color: theme.colors.text.neutral.intense,
	},
}));
