import { describe, expect, it } from "@jest/globals";
import { render } from "@testing-library/react-native";
import { Database } from "lucide-react-native";
import { StyleSheet } from "react-native";
import { themes } from "~/unistyles";
import { MessageState } from "./message-state";

describe("<MessageState>", () => {
	// This surface carries the horizontal safe-area inset on behalf of every call
	// site. Unistyles' jest mock resolves every stylesheet with zero
	// insets, so this assertion stands in for a device that reports none: the
	// design gutter has to survive, rather than the edge collapsing to the raw
	// inset. `StyleSheet` is imported from React Native here — not from
	// Unistyles, whose mock returns an array untouched — because the root style
	// is composed as an array and only React Native's `flatten` resolves one.
	it("keeps its horizontal gutter when the runtime reports no insets", () => {
		const { getByTestId } = render(
			<MessageState
				icon={Database}
				subtitle="Sign in to browse your collections."
				testID="message-state"
				title="Connect to Payload"
			/>,
		);

		const root = StyleSheet.flatten(getByTestId("message-state").props.style);

		expect(root.paddingStart).toBe(themes.light.gap.lg);
		expect(root.paddingEnd).toBe(themes.light.gap.lg);
	});

	// The welcome screen owns its top and bottom edges and clears them by passing
	// a style in here, which only works while the caller's style is merged last.
	// Nothing else pins that: the welcome screen's own test asserts 24 on every
	// edge, and this component's base gutter is also 24, so reversing the array
	// would make the override lose silently and leave that test green while the
	// notch stopped being cleared. A value no gutter produces is what makes this
	// one fail.
	it("lets a caller's style win over its own gutter", () => {
		const { getByTestId } = render(
			<MessageState
				icon={Database}
				style={{ paddingTop: 99 }}
				subtitle="Sign in to browse your collections."
				testID="message-state"
				title="Connect to Payload"
			/>,
		);

		const root = StyleSheet.flatten(getByTestId("message-state").props.style);

		expect(root.paddingTop).toBe(99);
	});
});
