import { describe, expect, it, jest } from "@jest/globals";
import { render } from "@testing-library/react-native";
import { SignInTextField, styles } from "./sign-in-text-field";

// the flagged treatment is a Unistyles variant, and the jest mock strips
// `variants` from every stylesheet and stubs `useVariants` to a no-op — so the
// destructive border and ground never reach the rendered tree here and cannot
// be asserted. what can still fail is the selection, which is what these two
// cover: delete the `useVariants` call, or compute `flagged` from the wrong
// thing, and they go red.
describe("<SignInTextField>", () => {
	it("selects the flagged variant while the field carries a message", () => {
		const useVariants = jest.spyOn(styles, "useVariants");

		try {
			render(
				<SignInTextField
					error="Enter your email address."
					errorTestID="sign-in-error-email"
					label="Email"
					onChangeText={() => {}}
					testID="sign-in-email"
					value=""
				/>,
			);

			expect(useVariants).toHaveBeenCalledWith({ flagged: true });
		} finally {
			useVariants.mockRestore();
		}
	});

	it("selects the unflagged variant while it carries none", () => {
		const useVariants = jest.spyOn(styles, "useVariants");

		try {
			render(
				<SignInTextField
					errorTestID="sign-in-error-email"
					label="Email"
					onChangeText={() => {}}
					testID="sign-in-email"
					value="you@example.com"
				/>,
			);

			// `false` is passed explicitly rather than left unset: to Unistyles the
			// two are not the same thing.
			expect(useVariants).toHaveBeenCalledWith({ flagged: false });
		} finally {
			useVariants.mockRestore();
		}
	});
});
