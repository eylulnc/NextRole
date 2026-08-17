import { describe, expect, it } from "vitest";
import { currencySymbol, formatSalaryRange } from "./currency";

describe("currencySymbol", () => {
	it("maps known currency codes to their symbol", () => {
		expect(currencySymbol("EUR")).toBe("€");
		expect(currencySymbol("USD")).toBe("$");
		expect(currencySymbol("GBP")).toBe("£");
		expect(currencySymbol("TRY")).toBe("₺");
	});

	it("falls back to the raw code for unknown currencies", () => {
		expect(currencySymbol("JPY")).toBe("JPY");
	});
});

describe("formatSalaryRange", () => {
	it("formats a range in thousands with the currency symbol", () => {
		expect(formatSalaryRange(70000, 85000, "EUR")).toBe("€70k–85k");
		expect(formatSalaryRange(60000, 72000, "USD")).toBe("$60k–72k");
	});

	it("returns null when either bound is missing", () => {
		expect(formatSalaryRange(null, 85000, "EUR")).toBeNull();
		expect(formatSalaryRange(70000, null, "EUR")).toBeNull();
		expect(formatSalaryRange(null, null, "EUR")).toBeNull();
	});
});
