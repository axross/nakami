import {
	Children,
	type ComponentPropsWithRef,
	isValidElement,
	type JSX,
} from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import {
	SettingMenuGroupContextProvider,
	type SettingMenuGroupItemPosition,
} from "./setting-menu-group-context";

/**
 * the body of a setting menu group: it stacks the rows it is given and publishes
 * each row's position, so a row rounds the right corners without its caller
 * restating where that row sits. a provider renders no host node of its own, so
 * the rows stay direct children of this `View` and the gap between them is
 * unchanged.
 */
export function SettingMenuGroupBody({
	children,
	style,
	...props
}: Readonly<ComponentPropsWithRef<typeof View>>): JSX.Element {
	// `Children.toArray` drops the `null` a conditional row renders and flattens
	// fragments, so a row's position counts the rows actually drawn; it also keys
	// every survivor, which is what the wrappers below are keyed by.
	const rows = Children.toArray(children).filter(isValidElement);

	return (
		<View style={[styles.body, style]} {...props}>
			{rows.map((row, index) => (
				<SettingMenuGroupContextProvider
					key={row.key}
					value={getRowPosition(index, rows.length)}
				>
					{row}
				</SettingMenuGroupContextProvider>
			))}
		</View>
	);
}

function getRowPosition(
	index: number,
	count: number,
): SettingMenuGroupItemPosition {
	if (count === 1) {
		return "only";
	}

	if (index === 0) {
		return "first";
	}

	if (index === count - 1) {
		return "last";
	}

	return "middle";
}

const styles = StyleSheet.create((theme) => ({
	// the rows sit flush and are separated by the gap between them rather than by
	// a border, so this `rowGap` is a hairline rather than a spacing step — the
	// group's ground shows through it as the separator.
	body: {
		rowGap: theme.borderWidth.hairline,
		paddingHorizontal: theme.gap.md,
	},
}));
