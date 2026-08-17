package com.nextrole.service

import com.nextrole.domain.Interview
import com.nextrole.repository.InterviewRepository
import com.nextrole.web.dto.CreateInterviewRequest
import org.springframework.stereotype.Service
import java.util.UUID

@Service
class InterviewService(
	private val interviewRepository: InterviewRepository,
	private val applicationService: ApplicationService
) {

	fun create(userId: UUID, applicationId: UUID, request: CreateInterviewRequest): Interview {
		applicationService.get(userId, applicationId)
		val interview = Interview(
			applicationId = applicationId,
			round = request.round,
			interviewer = request.interviewer,
			scheduledAt = request.scheduledAt,
			mode = request.mode,
			notes = request.notes
		)
		return interviewRepository.save(interview)
	}

	fun list(userId: UUID, applicationId: UUID): List<Interview> {
		applicationService.get(userId, applicationId)
		return interviewRepository.findByApplicationIdOrderByScheduledAtAsc(applicationId)
	}
}
