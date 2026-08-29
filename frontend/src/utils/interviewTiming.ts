const DEFAULT_INTERVIEW_DURATION_MINUTES = 60;
const JOIN_WINDOW_HOURS = 1;
export const REMINDER_WINDOW_HOURS = 3;

function isWithinWindow(scheduledAt: string, durationMinutes: number | null, beforeMs: number): boolean {
	const start = new Date(scheduledAt).getTime();
	const durationMs = (durationMinutes ?? DEFAULT_INTERVIEW_DURATION_MINUTES) * 60 * 1000;
	const now = Date.now();
	return now >= start - beforeMs && now <= start + durationMs;
}

export function isMeetingJoinable(scheduledAt: string, durationMinutes: number | null): boolean {
	return isWithinWindow(scheduledAt, durationMinutes, JOIN_WINDOW_HOURS * 60 * 60 * 1000);
}

export function isWithinReminderWindow(scheduledAt: string, durationMinutes: number | null): boolean {
	return isWithinWindow(scheduledAt, durationMinutes, REMINDER_WINDOW_HOURS * 60 * 60 * 1000);
}
