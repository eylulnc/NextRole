import { describe, expect, it } from "vitest";
import { findSchedulingConflict, type SchedulingConflictCandidate } from "./interviewTiming";

// Conflict detection exists twice by design: server-side (InterviewConflicts.kt) for what the
// Dashboard and Calendar display, and here for the interview form, which must warn on a time
// that hasn't been saved yet. These cases are mirrored one-for-one by InterviewConflictsTest.kt
// so the two can't silently drift apart.
describe("findSchedulingConflict — parity with the backend rule", () => {
	const candidate = (
		id: string,
		company: string,
		scheduledAt: string,
		durationMinutes: number | null
	): SchedulingConflictCandidate => ({ id, company, scheduledAt, durationMinutes });

	it("flags an overlapping interview", () => {
		const others = [candidate("iv-2", "Globex", "2026-10-01T14:30:00Z", 60)];

		const hit = findSchedulingConflict("2026-10-01T14:00:00Z", 60, others);

		expect(hit?.company).toBe("Globex");
	});

	it("treats back-to-back interviews as non-overlapping", () => {
		const others = [candidate("iv-2", "Globex", "2026-10-01T15:00:00Z", 60)];

		expect(findSchedulingConflict("2026-10-01T14:00:00Z", 60, others)).toBeUndefined();
	});

	it("falls back to a 60-minute duration when none is set", () => {
		const others = [candidate("iv-2", "Globex", "2026-10-01T14:45:00Z", null)];

		expect(findSchedulingConflict("2026-10-01T14:00:00Z", null, others)?.id).toBe("iv-2");
	});

	it("never reports an interview as conflicting with itself", () => {
		const others = [candidate("iv-1", "Acme", "2026-10-01T14:00:00Z", 60)];

		expect(findSchedulingConflict("2026-10-01T14:00:00Z", 60, others, "iv-1")).toBeUndefined();
	});

	it("returns nothing for an unparseable date rather than throwing", () => {
		const others = [candidate("iv-2", "Globex", "2026-10-01T14:30:00Z", 60)];

		expect(findSchedulingConflict("not-a-date", 60, others)).toBeUndefined();
	});
});
