import { Clock, ShieldAlert } from "lucide-react-native";
import type { JSX } from "react";
import { Modal, ScrollView, Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { CredentialConsentAction } from "~/auth/components/credential-consent-dialog/credential-consent-action";
import { CredentialConsentPoint } from "~/auth/components/credential-consent-dialog/credential-consent-point";

/**
 * the un-dismissable dialog a successful sign-in stops at: keep this sign-in on
 * the device so the app can renew the session by itself, or don't. it is the
 * whole of the consent behind storing a password, so it states what storing
 * buys and what it costs side by side and takes no answer as given.
 *
 * nothing dismisses it but its two buttons. there is no close control; the
 * scrim is a plain `View` rather than a `Pressable`, so a tap outside has
 * nothing to press; and `onRequestClose` — which React Native requires on
 * Android, where it is the hardware and gesture Back — is deliberately a no-op.
 * iOS has no swipe to intercept because swipe-to-dismiss is opt-in there:
 * `allowSwipeDismissal` is left unset, and React Native only routes the gesture
 * to `onRequestClose` when it is `true`.
 *
 * the two translucent props are what make the scrim reach the screen edges on
 * Android. a `Modal` opens in its own native window, outside the app's
 * edge-to-edge theme, so `react-native-edge-to-edge` (1.8.1, pinned) states
 * that both have to be set for one to draw under the system bars — without
 * them the bars show through as an unstyled band and the scrim's own
 * inset-derived padding is measured against a surface that does not reach
 * them. React Native pairs the two itself, warning that a translucent
 * navigation bar without a translucent status bar is unsupported, so they are
 * set together or not at all. Both are Android-only and inert on iOS, which
 * already covers the whole screen through `overFullScreen`.
 *
 * the body scrolls and the actions sit outside that scroll view, so the two
 * answers stay reachable at the largest system text size — the case where an
 * alert that sized itself to its content would push its own buttons off screen.
 *
 * `accessibilityViewIsModal` is what stops VoiceOver reaching the sign-in form
 * still mounted behind this; on Android the `Modal` already takes accessibility
 * focus on its own.
 *
 * `disabled` covers the one moment both answers are unpressable — while the
 * answer already given is being written to the keychain. it disables both, not
 * the one that was pressed, so a second press cannot queue the other answer
 * behind the first.
 */
export function CredentialConsentDialog({
	disabled = false,
	onAllow,
	onDecline,
	serverUrl,
}: Readonly<{
	disabled?: boolean;
	onAllow: () => void;
	onDecline: () => void;
	serverUrl: string;
}>): JSX.Element {
	return (
		<Modal
			animationType="fade"
			navigationBarTranslucent
			onRequestClose={() => {
				// intentionally empty: Android's Back must not answer this dialog.
				// React Native requires the prop there, so refusing to close is
				// expressed by handling the event and doing nothing rather than by
				// leaving it off.
			}}
			statusBarTranslucent
			transparent
			visible
		>
			<View style={styles.scrim} testID="credential-consent-scrim">
				<View
					accessibilityViewIsModal
					style={styles.card}
					testID="credential-consent-dialog"
				>
					<ScrollView
						contentContainerStyle={styles.body}
						testID="credential-consent-dialog-body"
					>
						<Text style={styles.title}>Stay signed in on this device?</Text>
						<Text style={styles.intro}>
							{serverUrl} ends a session on its own — often about two hours
							after you last opened Nakami — and Nakami can only renew one while
							it is open.
						</Text>

						<CredentialConsentPoint
							body="Nakami signs itself back in whenever the server ends the session, so you stay signed in for months rather than hours."
							heading="What storing it buys"
							icon={Clock}
							testID="credential-consent-benefit"
							tone="accent"
						/>

						<CredentialConsentPoint
							body="Your password is kept in this device's keychain, where no other app can read it and no backup or other device receives it. But if someone gets past your device's lock, they have your password itself rather than a session that expires on its own."
							heading="What storing it costs"
							icon={ShieldAlert}
							testID="credential-consent-risk"
							tone="destructive"
						/>

						<Text style={styles.footnote}>
							Signing out removes it. To change this later, sign out and sign in
							again.
						</Text>
					</ScrollView>

					<View style={styles.actions}>
						<CredentialConsentAction
							disabled={disabled}
							label="Store my sign-in"
							onPress={onAllow}
							testID="credential-consent-allow"
							variant="accent"
						/>
						<CredentialConsentAction
							disabled={disabled}
							label="Don't store it"
							onPress={onDecline}
							testID="credential-consent-decline"
							variant="neutral"
						/>
					</View>
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create((theme, rt) => ({
	// a tighter top than the other three, so the actions read as attached to the
	// text above them rather than as a separate band.
	actions: {
		paddingBottom: theme.gap.md,
		paddingHorizontal: theme.gap.md,
		paddingTop: theme.gap.sm,
		rowGap: theme.gap.xs,
	},
	body: {
		padding: theme.gap.md,
		rowGap: theme.gap.sm,
	},
	// `flexShrink` is what stops the card growing past the scrim's padded box, so
	// the scrim stays visible on every side at any text size — the cue that says
	// something is waiting behind this rather than that the app has navigated
	// somewhere new. its inner `ScrollView` takes the overflow.
	card: {
		backgroundColor: theme.colors.foundation.neutral.bare,
		borderRadius: theme.radius.lg,
		flexShrink: 1,
		// a ceiling rather than a design width: the card fills a phone, and stops
		// growing past a comfortable measure on the tablet widths the `md`
		// breakpoint covers, where a full-width alert would run its body to a line
		// length nobody reads.
		maxWidth: 420,
		width: "100%",
	},
	footnote: {
		...theme.typography.caption,
		color: theme.colors.text.neutral.base,
	},
	intro: {
		...theme.typography.body,
		color: theme.colors.text.neutral.base,
	},
	// the scrim insets by the safe area rather than sitting under it: the card is
	// centred, so a notch or a home indicator would otherwise crop the ends of a
	// card tall enough to reach them.
	scrim: {
		alignItems: "center",
		backgroundColor: theme.colors.scrim,
		flex: 1,
		justifyContent: "center",
		paddingBottom: Math.max(rt.insets.bottom, theme.gap.md),
		paddingEnd: Math.max(rt.insets.right, theme.gap.md),
		paddingStart: Math.max(rt.insets.left, theme.gap.md),
		paddingTop: Math.max(rt.insets.top, theme.gap.md),
	},
	title: {
		...theme.typography.title,
		color: theme.colors.text.neutral.intense,
	},
}));
