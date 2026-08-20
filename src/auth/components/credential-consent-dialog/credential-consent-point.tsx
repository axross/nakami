import type { LucideIcon } from "lucide-react-native";
import type { ComponentPropsWithRef, JSX } from "react";
import { Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

/**
 * one of the dialog's two blocks — what storing a sign-in buys, and what it
 * costs. both render through this part rather than through two shapes, because
 * the whole point of the dialog is that the two read as a matched pair a user
 * weighs against each other rather than as a headline and a disclaimer.
 *
 * `tone` selects the surface and the icon colour, and its two values name the
 * colour role each is actually drawn in — `accent` and `destructive`, the
 * vocabulary the theme itself uses. it is never the only cue: the icon and the
 * heading say which block this is on their own, so the pair survives a reader
 * who cannot tell the two surfaces apart.
 */
export function CredentialConsentPoint({
	body,
	heading,
	icon: Icon,
	style,
	tone,
	...props
}: Readonly<
	Omit<ComponentPropsWithRef<typeof View>, "children"> & {
		body: string;
		heading: string;
		icon: LucideIcon;
		tone: "accent" | "destructive";
	}
>): JSX.Element {
	const { theme } = useUnistyles();

	return (
		<View
			{...props}
			style={[
				styles.point,
				tone === "destructive" ? styles.pointDestructive : styles.pointAccent,
				style,
			]}
		>
			<Icon
				color={
					tone === "destructive"
						? theme.colors.text.destructive.base
						: theme.colors.text.accent.base
				}
				size={18}
			/>
			<View style={styles.column}>
				<Text
					style={[
						styles.heading,
						tone === "destructive"
							? styles.headingDestructive
							: styles.headingAccent,
					]}
				>
					{heading}
				</Text>
				<Text style={styles.body}>{body}</Text>
			</View>
		</View>
	);
}

const styles = StyleSheet.create((theme) => ({
	body: {
		...theme.typography.caption,
		color: theme.colors.text.neutral.base,
	},
	column: {
		flexGrow: 1,
		flexShrink: 1,
		rowGap: theme.gap.xs,
	},
	heading: {
		...theme.typography.caption,
		fontFamily: theme.typography.heading.fontFamily,
	},
	headingAccent: {
		color: theme.colors.text.accent.base,
	},
	headingDestructive: {
		color: theme.colors.text.destructive.base,
	},
	// the icon sits on the first line of the heading rather than centred against
	// the whole block: the body runs to several lines, and centring would drift
	// the icon down to the middle of the paragraph it labels.
	point: {
		alignItems: "flex-start",
		borderRadius: theme.radius.md,
		borderWidth: theme.borderWidth.hairline,
		columnGap: theme.gap.xs,
		flexDirection: "row",
		padding: theme.gap.sm,
	},
	pointAccent: {
		backgroundColor: theme.colors.surface.accent.base,
		borderColor: theme.colors.border.accent.subtle,
	},
	pointDestructive: {
		backgroundColor: theme.colors.surface.destructive.base,
		borderColor: theme.colors.border.destructive.subtle,
	},
}));
