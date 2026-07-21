import { describe, expect, it } from "@jest/globals";
import { normalizeServerUrl } from "./server-url";

describe("normalizeServerUrl", () => {
	it("accepts an https URL", () => {
		expect(normalizeServerUrl("https://cms.example.com")).toBe(
			"https://cms.example.com",
		);
	});

	it("accepts a plain-http URL (self-hosted LAN setup)", () => {
		expect(normalizeServerUrl("http://192.168.1.10:3000")).toBe(
			"http://192.168.1.10:3000",
		);
	});

	it("trims whitespace and strips trailing slashes", () => {
		expect(normalizeServerUrl("  https://cms.example.com/  ")).toBe(
			"https://cms.example.com",
		);
	});

	it("returns null for a missing scheme", () => {
		expect(normalizeServerUrl("cms.example.com")).toBeNull();
	});

	it("returns null for a non-http(s) scheme", () => {
		expect(normalizeServerUrl("ftp://cms.example.com")).toBeNull();
	});

	it("returns null for an empty value", () => {
		expect(normalizeServerUrl("   ")).toBeNull();
	});
});
