import { describe, expect, it } from "@jest/globals";
import { render } from "@testing-library/react-native";
import { resolveStyle } from "~/common/test-helpers/resolve-style";
import { themes } from "~/unistyles";
import { CollectionRecordOfflineNotice } from "./collection-record-offline-notice";

describe("<CollectionRecordOfflineNotice>", () => {
	// this band spans the screen rather than sitting inside the fields' gutter,
	// so the horizontal safe-area inset is its own rather than the field list's.
	// Unistyles' jest mock resolves every stylesheet with zero insets, so this
	// assertion stands in for a device reporting none: the gutter the fields
	// below already use has to survive, rather than the edge collapsing to the
	// raw inset and putting the notice hard against the screen.
	it("keeps the fields' own gutter when the runtime reports no insets", () => {
		const { getByTestId } = render(<CollectionRecordOfflineNotice />);

		const band = resolveStyle(
			getByTestId("collection-record-offline-notice").props.style,
		);

		expect(band.paddingStart).toBe(themes.light.gap.md);
		expect(band.paddingEnd).toBe(themes.light.gap.md);
	});
});
