import { describe, expect, it } from "@jest/globals";
import { describeRecordCount } from "./record-count-label";

describe("describeRecordCount()", () => {
	it("reports the collection's own size, pluralised", () => {
		expect(describeRecordCount({ kind: "all", total: 128 })).toBe(
			"128 records",
		);
		expect(describeRecordCount({ kind: "all", total: 1 })).toBe("1 record");
	});

	it("reports an empty collection as zero rather than as no answer", () => {
		expect(describeRecordCount({ kind: "all", total: 0 })).toBe("0 records");
	});

	it("reports how much of the collection a search matched, pluralised", () => {
		expect(describeRecordCount({ kind: "matches", total: 3 })).toBe(
			"3 matching records",
		);
		expect(describeRecordCount({ kind: "matches", total: 1 })).toBe(
			"1 matching record",
		);
	});

	it("says a search matched nothing in words rather than as a count of zero", () => {
		expect(describeRecordCount({ kind: "matches", total: 0 })).toBe(
			"No matching records",
		);
	});

	it("says a search is still running when there is no count yet", () => {
		expect(describeRecordCount({ kind: "searching" })).toBe("Searching…");
	});
});
