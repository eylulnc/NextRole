import i18n from "../i18n/config";

export function formatDateTime(iso: string): string {
	return new Intl.DateTimeFormat(i18n.language, {
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
	}).format(new Date(iso));
}

export function formatTime(iso: string): string {
	return new Intl.DateTimeFormat(i18n.language, {
		hour: "numeric",
		minute: "2-digit",
	}).format(new Date(iso));
}

export function formatDate(iso: string): string {
	return new Intl.DateTimeFormat(i18n.language, {
		month: "short",
		day: "numeric",
		year: "numeric",
	}).format(new Date(iso));
}
