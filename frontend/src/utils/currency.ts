export const CURRENCY_OPTIONS = ["EUR", "USD", "GBP", "TRY"] as const;

const CURRENCY_SYMBOLS: Record<string, string> = {
	EUR: "€",
	USD: "$",
	GBP: "£",
	TRY: "₺",
};

export function currencySymbol(currency: string): string {
	return CURRENCY_SYMBOLS[currency] ?? currency;
}

export function formatSalaryRange(min: number | null, max: number | null, currency: string): string | null {
	if (!min || !max) return null;
	const symbol = currencySymbol(currency);
	return `${symbol}${min / 1000}k–${max / 1000}k`;
}
