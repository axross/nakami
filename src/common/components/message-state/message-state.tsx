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
 * The root deliberately carries no `flex`: how much of the surrounding layout
 * this surface claims is the consumer's call, supplied through `style`.
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
	root: {
		alignItems: "center",
		backgroundColor: theme.colors.foundation.neutral.bare,
		justifyContent: "center",
		padding: theme.gap.lg,
		rowGap: theme.gap.xs,
	},
	subtitle: {
		color: theme.colors.text.neutral.base,
		fontFamily: theme.fonts.paragraph,
		fontSize: 16,
		maxWidth: 280,
		textAlign: "center",
	},
	title: {
		color: theme.colors.text.neutral.intense,
		fontFamily: theme.fonts.heading,
		fontSize: 20,
	},
}));
