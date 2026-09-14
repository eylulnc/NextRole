package com.nextrole.service

import com.nextrole.domain.Application
import com.nextrole.domain.Interview
import com.nextrole.web.dto.InterviewConflictResponse
import java.time.Duration
import java.util.UUID

/**
 * Detects interviews whose [scheduledAt, scheduledAt + duration) windows overlap.
 *
 * This lives server-side so every surface sees the same answer: the Dashboard only renders the
 * few soonest interviews, so a client-side check over that slice would miss conflicts further out.
 * Overlap is a warning, never an invariant — nothing here blocks saving a conflicting interview.
 */
object InterviewConflicts {

	const val DEFAULT_DURATION_MINUTES = 60

	/**
	 * Maps each interview id to the first other interview it overlaps, considering [interviews] in
	 * the order given. Interviews whose application is missing are ignored on both sides, since a
	 * conflict is only reportable if we can name the company it clashes with.
	 */
	fun findConflicts(
		interviews: List<Interview>,
		applicationsById: Map<UUID, Application>
	): Map<UUID, InterviewConflictResponse> {
		val known = interviews.filter { applicationsById.containsKey(it.applicationId) }
		val conflicts = mutableMapOf<UUID, InterviewConflictResponse>()
		for (interview in known) {
			val other = known.firstOrNull { it.id != interview.id && overlaps(interview, it) } ?: continue
			val application = applicationsById.getValue(other.applicationId)
			conflicts[interview.id] = InterviewConflictResponse(
				id = other.id,
				applicationId = other.applicationId,
				company = application.company,
				scheduledAt = other.scheduledAt,
				durationMinutes = other.durationMinutes
			)
		}
		return conflicts
	}

	private fun overlaps(a: Interview, b: Interview): Boolean =
		a.scheduledAt < endOf(b) && b.scheduledAt < endOf(a)

	private fun endOf(interview: Interview) =
		interview.scheduledAt.plus(Duration.ofMinutes((interview.durationMinutes ?: DEFAULT_DURATION_MINUTES).toLong()))
}
