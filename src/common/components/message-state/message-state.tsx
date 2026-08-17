import type { LucideIcon } from "lucide-react-native";
import type { ComponentPropsWithRef, JSX, ReactNode } from "react";
import { Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

/**
 * A centered "mark + title + subtitle" surface with optional status and action
 * slots — the shared shape behind feature empty/error/placeholder screens.
 * Callers pass their own elements so each keeps its distinct control (a
 * navigation link, a retry button) and its own read-out of what the screen is
 * waiting on.
 *
 * The root claims no space of its own: a consumer that gives it a whole screen
 * passes `flex: 1` through `style`.
 *
 * Rendered by `welcome-screen` directly and by `collections-message-state`, which
 * the Collections list and record screens both use. That inventory is load-bearing
 * rather than descriptive: the horizontal safe-area inset below is carried here on
 * every call site's behalf, so it only reaches the screen edge while each of them
 * both fills its surface and sits flush against it.
 */
export function MessageState({
	icon: Icon,
	iconColor,
	title,
	subtitle,
	status,
	action,
	style,
	...props
}: Readonly<
	Omit<ComponentPropsWithRef<typeof View>, "children"> & {
		icon: LucideIcon;
		iconColor?: string;
		title: string;
		subtitle: string;
		status?: ReactNode;
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

			{status}
			{action}
		</View>
	);
}

const styles = StyleSheet.create((theme, rt) => ({
	mark: {
		alignItems: "center",
		aspectRatio: 1,
		backgroundColor: theme.colors.foundation.neutral.subtle,
		borderRadius: theme.radius.lg,
		justifyContent: "center",
		marginBottom: theme.gap.xs,
		width: 66,
	},
	// Deliberately no fill here: how much room the surface gets is the consumer's
	// half of the split, so do not "fix" this by adding one.
	//
	// The horizontal safe-area inset is carried here for every call site, because
	// each of them renders this surface flush against the screen's own edges. The
	// vertical pair is left as the plain gutter: a caller that owns its top or
	// bottom edge (the welcome screen) overrides it through `style`, which comes
	// last in the array and therefore wins. That array order is load-bearing —
	// reversing it would make every consumer override lose, including the `flex`
	// each of them supplies — and the test that holds it lives beside this file.
	// Both sides are written as longhands so no shorthand-versus-longhand
	// precedence is involved in reading which value applies.
	root: {
		alignItems: "center",
		backgroundColor: theme.colors.foundation.neutral.bare,
		justifyContent: "center",
		paddingBottom: theme.gap.lg,
		paddingEnd: Math.max(rt.insets.right, theme.gap.lg),
		paddingStart: Math.max(rt.insets.left, theme.gap.lg),
		paddingTop: theme.gap.lg,
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
