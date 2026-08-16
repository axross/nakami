import { describe, expect, it } from "@jest/globals";
import { render } from "@testing-library/react-native";
import { Database } from "lucide-react-native";
import { StyleSheet } from "react-native";
import { themes } from "~/unistyles";
import { MessageState } from "./message-state";

describe("<MessageState>", () => {
	// This surface carries the horizontal safe-area inset on behalf of all three
	// of its call sites. Unistyles' jest mock resolves every stylesheet with zero
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
});
