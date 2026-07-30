import { describe, expect, it } from "@jest/globals";
import { render } from "@testing-library/react-native";
import { Database } from "lucide-react-native";
import { StyleSheet } from "react-native";
import { MessageState } from "./message-state";

/**
 * The props contract is invisible to the type-checker — a dropped rest object
 * still compiles — so these assert against the rendered root instead.
 */
describe("<MessageState>", () => {
	it("forwards undeclared props, including the test hook, to its root", () => {
		const { getByTestId } = render(
			<MessageState
				accessibilityLabel="Nothing here"
				icon={Database}
				pointerEvents="none"
				subtitle="Nothing to show."
				testID="caller-supplied-hook"
				title="Empty"
			/>,
		);

		const root = getByTestId("caller-supplied-hook");

		expect(root.props.accessibilityLabel).toBe("Nothing here");
		expect(root.props.pointerEvents).toBe("none");
	});

	it("merges the caller's style over its own", () => {
		const { getByTestId } = render(
			<MessageState
				icon={Database}
				style={{ backgroundColor: "#ff0000", flex: 1 }}
				subtitle="Nothing to show."
				testID="message-state"
				title="Empty"
			/>,
		);

		const style = StyleSheet.flatten(getByTestId("message-state").props.style);

		// The caller wins on a property the component also sets…
		expect(style.backgroundColor).toBe("#ff0000");
		// …and the component's own appearance survives the merge.
		expect(style.alignItems).toBe("center");
		expect(style.flex).toBe(1);
	});

	it("leaves the fill to its consumer", () => {
		const { getByTestId } = render(
			<MessageState
				icon={Database}
				subtitle="Nothing to show."
				testID="message-state"
				title="Empty"
			/>,
		);

		const style = StyleSheet.flatten(getByTestId("message-state").props.style);

		expect(style.flex).toBeUndefined();
	});
});
