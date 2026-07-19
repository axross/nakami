import { describe, expect, it } from "@jest/globals";
import { render } from "@testing-library/react-native";
import { HomeScreen } from "./home-screen";

describe("<HomeScreen>", () => {
  it("renders the app title and subtitle", () => {
    const { getByTestId, getByText } = render(<HomeScreen />);

    expect(getByTestId("home-screen")).toBeTruthy();
    expect(getByText("Payload Mobile")).toBeTruthy();
    expect(getByText("A companion mobile app for Payload CMS.")).toBeTruthy();
  });
});
