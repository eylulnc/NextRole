package com.nextrole.service

import com.nextrole.repository.ApplicationRepository
import com.nextrole.repository.InterviewRepository
import com.nextrole.web.dto.UpcomingInterviewResponse
import org.springframework.stereotype.Service
import java.util.UUID

@Service
class CalendarService(
	private val applicationRepository: ApplicationRepository,
	private val interviewRepository: InterviewRepository
) {

	fun getInterviews(userId: UUID): List<UpcomingInterviewResponse> {
		val applicationsById = applicationRepository.findByUserId(userId).associateBy { it.id }
		val interviews = interviewRepository.findAllByUserId(userId)
		val conflicts = InterviewConflicts.findConflicts(interviews, applicationsById)
		return interviews.mapNotNull { interview ->
			val application = applicationsById[interview.applicationId] ?: return@mapNotNull null
			UpcomingInterviewResponse(
				id = interview.id,
				applicationId = interview.applicationId,
				company = application.company,
				role = application.role,
				round = interview.round,
				scheduledAt = interview.scheduledAt,
				mode = interview.mode,
				durationMinutes = interview.durationMinutes,
				meetingLink = interview.meetingLink,
				conflictsWith = conflicts[interview.id]
			)
		}
	}
}
