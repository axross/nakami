import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	jest,
} from "@jest/globals";
import { act, renderHook } from "@testing-library/react-native";
import { useDebouncedValue } from "./use-debounced-value";

beforeEach(() => {
	jest.useFakeTimers();
});

afterEach(() => {
	jest.useRealTimers();
});

describe("useDebouncedValue()", () => {
	it("reports the first value straight away, with nothing to wait out", () => {
		const { result } = renderHook(() => useDebouncedValue("posts", 300));

		expect(result.current).toBe("posts");
	});

	it("holds the previous value until the new one has stood still for the delay", () => {
		const { rerender, result } = renderHook(
			({ value }: { value: string }) => useDebouncedValue(value, 300),
			{ initialProps: { value: "" } },
		);

		rerender({ value: "rel" });
		expect(result.current).toBe("");

		act(() => {
			jest.advanceTimersByTime(299);
		});
		expect(result.current).toBe("");

		act(() => {
			jest.advanceTimersByTime(1);
		});
		expect(result.current).toBe("rel");
	});

	it("settles once on the last of a burst rather than once per change", () => {
		const { rerender, result } = renderHook(
			({ value }: { value: string }) => useDebouncedValue(value, 300),
			{ initialProps: { value: "" } },
		);

		for (const value of ["r", "re", "rel", "rele", "relea"]) {
			rerender({ value });
			act(() => {
				jest.advanceTimersByTime(100);
			});
		}

		expect(result.current).toBe("");

		act(() => {
			jest.advanceTimersByTime(300);
		});
		expect(result.current).toBe("relea");
	});

	it("stays put when a value is typed away and retyped inside the delay", () => {
		const { rerender, result } = renderHook(
			({ value }: { value: string }) => useDebouncedValue(value, 300),
			{ initialProps: { value: "release" } },
		);

		rerender({ value: "releas" });
		act(() => {
			jest.advanceTimersByTime(100);
		});
		rerender({ value: "release" });
		act(() => {
			jest.advanceTimersByTime(300);
		});

		expect(result.current).toBe("release");
	});
});
