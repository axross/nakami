import { describe, expect, it } from "@jest/globals";
import { render } from "@testing-library/react-native";
import type { JSX } from "react";
import { Text, View } from "react-native";
import { SettingMenuGroupBody } from "./setting-menu-group-body";
import { useSettingMenuGroupContext } from "./setting-menu-group-context";

/**
 * renders the position the body published, which is what these tests assert
 * against. the rendered corner radii cannot stand in for it: the suite mocks
 * Unistyles (`react-native-unistyles/mocks`), and that mock strips a style's
 * `variants` and stubs `useVariants` to a no-op, so every row resolves to the
 * same radius-free style whatever its position.
 */
function PositionProbe({ testID }: Readonly<{ testID: string }>): JSX.Element {
	const position = useSettingMenuGroupContext({
		componentName: "PositionProbe",
	});

	return <Text testID={testID}>{position}</Text>;
}

describe("<SettingMenuGroupBody>", () => {
	it("publishes `only` to a single row, so it rounds all four corners", () => {
		const { getByTestId } = render(
			<SettingMenuGroupBody>
				<PositionProbe testID="sole" />
			</SettingMenuGroupBody>,
		);

		expect(getByTestId("sole")).toHaveTextContent("only");
	});

	it("publishes `first`, `middle`, and `last` down a run of rows", () => {
		const { getByTestId } = render(
			<SettingMenuGroupBody>
				<PositionProbe testID="top" />
				<PositionProbe testID="centre" />
				<PositionProbe testID="bottom" />
			</SettingMenuGroupBody>,
		);

		expect(getByTestId("top")).toHaveTextContent("first");
		expect(getByTestId("centre")).toHaveTextContent("middle");
		expect(getByTestId("bottom")).toHaveTextContent("last");
	});

	// the License row arrives wrapped in a `<Link asChild>`, so the wrapper rather
	// than the row is what the body counts and provides to. the row still reads
	// its position, because the provider encloses the wrapper.
	it("reaches a row nested inside a wrapper element", () => {
		const { getByTestId } = render(
			<SettingMenuGroupBody>
				<PositionProbe testID="top" />
				<View>
					<PositionProbe testID="wrapped" />
				</View>
				<PositionProbe testID="bottom" />
			</SettingMenuGroupBody>,
		);

		expect(getByTestId("wrapped")).toHaveTextContent("middle");
	});

	// a row rendered by a false branch is absent rather than empty, so the row
	// above it is still the last one and still rounds the bottom corners.
	it("counts only the rows actually drawn, skipping a conditional row's `null`", () => {
		const showDebugRow = false;

		const { getByTestId } = render(
			<SettingMenuGroupBody>
				<PositionProbe testID="top" />
				<PositionProbe testID="bottom" />
				{showDebugRow ? <PositionProbe testID="conditional" /> : null}
			</SettingMenuGroupBody>,
		);

		expect(getByTestId("bottom")).toHaveTextContent("last");
	});
});
