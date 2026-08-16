import { createContext, useContext } from "react";

/**
 * Where a row sits among its siblings inside a `<SettingMenuGroupBody>`, which is
 * what decides the corners it rounds. The body derives it from the children it is
 * handed, so no caller ever states it.
 */
export type SettingMenuGroupItemPosition = "first" | "middle" | "last" | "only";

const SettingMenuGroupContext =
	createContext<SettingMenuGroupItemPosition | null>(null);

export const SettingMenuGroupContextProvider = SettingMenuGroupContext.Provider;

/**
 * Reads the position the enclosing body published. Neither this hook nor the
 * context it reads leaves this directory: a row is a part of the group, and a
 * `View` elsewhere reading the same context would be composing the group from
 * outside it.
 */
export function useSettingMenuGroupContext({
	componentName,
}: Readonly<{ componentName: string }>): SettingMenuGroupItemPosition {
	const position = useContext(SettingMenuGroupContext);

	if (position === null) {
		throw new Error(
			`<${componentName}> must be used within a <SettingMenuGroupBody> component.`,
		);
	}

	return position;
}
