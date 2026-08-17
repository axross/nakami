import { describe, expect, it } from "@jest/globals";
import { describeQueryKey, getSessionQueryKeyRoot } from "./session-query-key";

const USER_ID = "68b0c1d2e3f4a5b6c7d8e9f0";

describe("describeQueryKey()", () => {
	it("describes a collection-list key as the collection-list path", () => {
		expect(
			describeQueryKey([...getSessionQueryKeyRoot(USER_ID), "collections"]),
		).toBe("users/*/collections");
	});

	it("keeps the collection slug in a collection-records key", () => {
		expect(
			describeQueryKey([
				...getSessionQueryKeyRoot(USER_ID),
				"collections",
				"posts",
				"records",
			]),
		).toBe("users/*/collections/posts/records");
	});

	it("never carries the user id the key was scoped to", () => {
		expect(
			describeQueryKey([...getSessionQueryKeyRoot(USER_ID), "collections"]),
		).not.toContain(USER_ID);
	});

	it("keeps every segment of a key rooted outside the session", () => {
		expect(describeQueryKey(["devices", "device-1", "settings"])).toBe(
			"devices/device-1/settings",
		);
	});

	it("adds no redacted segment to a key shorter than the session root", () => {
		expect(describeQueryKey(["users"])).toBe("users");
	});

	// The boundary of that same length guard, from the other side. A guard that
	// admitted only keys longer than the root would describe this one as
	// `users/<the signed-in user's id>`, so the redaction is asserted here rather
	// than left to the deeper keys above.
	it("redacts the user id from a key that is exactly the session root", () => {
		const described = describeQueryKey(getSessionQueryKeyRoot(USER_ID));

		expect(described).toBe("users/*");
		expect(described).not.toContain(USER_ID);
	});

	it("describes a segment that is not a string without serializing it", () => {
		const described = describeQueryKey([
			...getSessionQueryKeyRoot(USER_ID),
			"collections",
			{ status: "draft" },
		]);

		expect(described).toBe("users/*/collections/?");
		expect(described).not.toContain("draft");
	});
});
