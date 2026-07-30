import {
	Children,
	type ComponentPropsWithoutRef,
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
 * The body of a setting menu group: it stacks the rows it is given and
 * publishes each row's position, so a row rounds the right corners without its
 * caller restating where that row sits.
 */
export function SettingMenuGroupBody({
	children,
	style,
	...props
}: Readonly<ComponentPropsWithoutRef<typeof View>>): JSX.Element {
	const items = Children.toArray(children).filter(isValidElement);

	return (
		<View style={[styles.body, style]} {...props}>
			{items.map((item, index) => (
				<SettingMenuGroupContextProvider
					key={item.key}
					value={getItemPosition(index, items.length)}
				>
					{item}
				</SettingMenuGroupContextProvider>
			))}
		</View>
	);
}

function getItemPosition(
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
	body: {
		paddingHorizontal: theme.gap.md,
		rowGap: 1,
	},
}));
