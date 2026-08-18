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
		return interviewRepository.findAllByUserId(userId).mapNotNull { interview ->
			val application = applicationsById[interview.applicationId] ?: return@mapNotNull null
			UpcomingInterviewResponse(
				applicationId = interview.applicationId,
				company = application.company,
				role = application.role,
				round = interview.round,
				scheduledAt = interview.scheduledAt
			)
		}
	}
}
