import { describe, expect, it } from "@jest/globals";
import { render } from "@testing-library/react-native";
import { Database } from "lucide-react-native";
import { MessageState } from "./message-state";

/**
 * Flattens whatever React Native accepts as a `style` prop (an object, or an
 * arbitrarily nested array of them) into the single resolved object the
 * renderer would apply.
 */
function resolveStyle(style: unknown): Record<string, unknown> {
	if (Array.isArray(style)) {
		return Object.assign({}, ...style.map(resolveStyle));
	}

	return typeof style === "object" && style !== null
		? (style as Record<string, unknown>)
		: {};
}

describe("<MessageState>", () => {
	// A dropped rest object type-checks and fails silently — the caller's prop
	// simply never reaches a node — so this is the only place the forwarding is
	// actually proven.
	it("forwards an undeclared prop and the caller's test hook to the root", () => {
		const { getByTestId } = render(
			<MessageState
				icon={Database}
				pointerEvents="none"
				subtitle="Sign in to browse your collections."
				testID="welcome-screen"
				title="Connect to Payload"
			/>,
		);

		expect(getByTestId("welcome-screen").props.pointerEvents).toBe("none");
	});

	// The consumer owns where the surface sits; the component owns what it looks
	// like. Merging last is what makes the first half true without discarding the
	// second.
	it("merges the caller's style last, over a property it sets itself", () => {
		const { getByTestId } = render(
			<MessageState
				icon={Database}
				style={{ padding: 0 }}
				subtitle="Sign in to browse your collections."
				testID="welcome-screen"
				title="Connect to Payload"
			/>,
		);

		expect(
			resolveStyle(getByTestId("welcome-screen").props.style),
		).toMatchObject({
			alignItems: "center",
			justifyContent: "center",
			padding: 0,
		});
	});

	// How much room this surface gets is the consumer's half of the split: a root
	// that claimed `flex: 1` for itself could not be placed beside anything else.
	it("claims no fill of its own", () => {
		const { getByTestId } = render(
			<MessageState
				icon={Database}
				subtitle="Sign in to browse your collections."
				testID="welcome-screen"
				title="Connect to Payload"
			/>,
		);

		expect(
			resolveStyle(getByTestId("welcome-screen").props.style),
		).not.toHaveProperty("flex");
	});
});
