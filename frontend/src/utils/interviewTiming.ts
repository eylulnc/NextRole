import type { InterviewReminderMode } from "../api/auth";

const DEFAULT_INTERVIEW_DURATION_MINUTES = 60;
const JOIN_WINDOW_HOURS = 1;

function isWithinWindow(scheduledAt: string, durationMinutes: number | null, beforeMs: number): boolean {
	const start = new Date(scheduledAt).getTime();
	const durationMs = (durationMinutes ?? DEFAULT_INTERVIEW_DURATION_MINUTES) * 60 * 1000;
	const now = Date.now();
	return now >= start - beforeMs && now <= start + durationMs;
}

export function isMeetingJoinable(scheduledAt: string, durationMinutes: number | null): boolean {
	return isWithinWindow(scheduledAt, durationMinutes, JOIN_WINDOW_HOURS * 60 * 60 * 1000);
}

// Reminder-mode choice: a single select value encoding both the mode and (for "HOURS") its window.
export type ReminderChoice = "OFF" | "ALWAYS" | "HOURS_3" | "HOURS_12" | "HOURS_24";

export const REMINDER_CHOICES: ReminderChoice[] = ["OFF", "ALWAYS", "HOURS_3", "HOURS_12", "HOURS_24"];

export function encodeReminderChoice(mode: InterviewReminderMode, hours: number): ReminderChoice {
	if (mode === "OFF") return "OFF";
	if (mode === "ALWAYS") return "ALWAYS";
	if (hours <= 3) return "HOURS_3";
	if (hours <= 12) return "HOURS_12";
	return "HOURS_24";
}

export function decodeReminderChoice(choice: ReminderChoice): { mode: InterviewReminderMode; hours: number } {
	switch (choice) {
		case "OFF":
			return { mode: "OFF", hours: 24 };
		case "ALWAYS":
			return { mode: "ALWAYS", hours: 24 };
		case "HOURS_3":
			return { mode: "HOURS", hours: 3 };
		case "HOURS_12":
			return { mode: "HOURS", hours: 12 };
		case "HOURS_24":
			return { mode: "HOURS", hours: 24 };
	}
}

export interface SchedulingConflictCandidate {
	id: string;
	company: string;
	scheduledAt: string;
	durationMinutes: number | null;
}

// Finds another interview whose [start, end) window overlaps the given one, if any.
export function findSchedulingConflict(
	scheduledAt: string,
	durationMinutes: number | null,
	candidates: SchedulingConflictCandidate[],
	excludeId?: string
): SchedulingConflictCandidate | undefined {
	const start = new Date(scheduledAt).getTime();
	if (Number.isNaN(start)) return undefined;
	const end = start + (durationMinutes ?? DEFAULT_INTERVIEW_DURATION_MINUTES) * 60 * 1000;
	return candidates.find((candidate) => {
		if (candidate.id === excludeId) return false;
		const candidateStart = new Date(candidate.scheduledAt).getTime();
		const candidateEnd = candidateStart + (candidate.durationMinutes ?? DEFAULT_INTERVIEW_DURATION_MINUTES) * 60 * 1000;
		return start < candidateEnd && candidateStart < end;
	});
}

export function isSameLocalDay(a: string, b: string): boolean {
	const dateA = new Date(a);
	const dateB = new Date(b);
	return (
		dateA.getFullYear() === dateB.getFullYear() &&
		dateA.getMonth() === dateB.getMonth() &&
		dateA.getDate() === dateB.getDate()
	);
}

// Whether a reminder for this interview should be shown at all, per the user's reminder mode/window.
export function isWithinReminderMode(
	scheduledAt: string,
	durationMinutes: number | null,
	mode: InterviewReminderMode,
	hours: number
): boolean {
	if (mode === "OFF") return false;
	if (mode === "ALWAYS") return isSameLocalDay(scheduledAt, new Date().toISOString());
	return isWithinWindow(scheduledAt, durationMinutes, hours * 60 * 60 * 1000);
}
