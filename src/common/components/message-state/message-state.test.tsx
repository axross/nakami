import { describe, expect, it } from "@jest/globals";
import { render } from "@testing-library/react-native";
import { Database } from "lucide-react-native";
import { createRef } from "react";
import type { View } from "react-native";
import { resolveStyle } from "~/common/test-helpers/resolve-style";
import { themes } from "~/unistyles";
import { MessageState } from "./message-state";

describe("<MessageState>", () => {
	// a dropped rest object type-checks and fails silently — the caller's prop
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

	// `ref` is an ordinary prop on React 19, so a props type that strips it leaves
	// a caller unable to measure or focus the surface at all. asserting the
	// populated instance rather than only that the call type-checks is what
	// proves the spread carried it the whole way to the root.
	it("populates a caller's ref with the root node it renders", () => {
		const ref = createRef<View>();

		render(
			<MessageState
				icon={Database}
				ref={ref}
				subtitle="Sign in to browse your collections."
				testID="welcome-screen"
				title="Connect to Payload"
			/>,
		);

		expect(ref.current).not.toBeNull();
		expect(ref.current?.props.testID).toBe("welcome-screen");
	});

	// the consumer owns where the surface sits; the component owns what it looks
	// like. merging last is what makes the first half true without discarding the
	// second — and two consumers now depend on it: every call site supplies the
	// `flex` this root deliberately omits, and the welcome screen clears its own
	// top and bottom edges through the same prop.
	//
	// the asserted value is deliberately one no gutter here produces. at zero
	// insets the welcome screen's override resolves to the same 24 as this root's
	// own padding, so reversing the array would make every override lose while
	// that screen's test stayed green and the notch stopped being cleared.
	it("merges the caller's style last, over a property it sets itself", () => {
		const { getByTestId } = render(
			<MessageState
				icon={Database}
				style={{ paddingTop: 99 }}
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
			paddingTop: 99,
		});
	});

	// how much room this surface gets is the consumer's half of the split: a root
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

	// this surface carries the horizontal safe-area inset on behalf of every call
	// site. Unistyles' jest mock resolves every stylesheet with zero insets, so
	// this assertion stands in for a device that reports none: the design gutter
	// has to survive, rather than the edge collapsing to the raw inset.
	it("keeps its horizontal gutter when the runtime reports no insets", () => {
		const { getByTestId } = render(
			<MessageState
				icon={Database}
				subtitle="Sign in to browse your collections."
				testID="welcome-screen"
				title="Connect to Payload"
			/>,
		);

		const root = resolveStyle(getByTestId("welcome-screen").props.style);

		expect(root.paddingStart).toBe(themes.light.gap.lg);
		expect(root.paddingEnd).toBe(themes.light.gap.lg);
	});
});
