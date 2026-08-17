const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
	month: "short",
	day: "numeric",
	hour: "numeric",
	minute: "2-digit",
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
	month: "short",
	day: "numeric",
	year: "numeric",
});

export function formatDateTime(iso: string): string {
	return dateTimeFormatter.format(new Date(iso));
}

export function formatDate(iso: string): string {
	return dateFormatter.format(new Date(iso));
}
