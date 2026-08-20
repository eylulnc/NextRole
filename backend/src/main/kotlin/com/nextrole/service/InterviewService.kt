package com.nextrole.service

import com.nextrole.domain.Interview
import com.nextrole.exception.ResourceNotFoundException
import com.nextrole.repository.InterviewRepository
import com.nextrole.web.dto.CreateInterviewRequest
import com.nextrole.web.dto.UpdateInterviewRequest
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

	fun update(userId: UUID, applicationId: UUID, interviewId: UUID, request: UpdateInterviewRequest): Interview {
		val interview = get(userId, applicationId, interviewId)
		request.round?.let { interview.round = it }
		request.interviewer?.let { interview.interviewer = it }
		request.scheduledAt?.let { interview.scheduledAt = it }
		request.mode?.let { interview.mode = it }
		request.notes?.let { interview.notes = it }
		return interviewRepository.save(interview)
	}

	fun delete(userId: UUID, applicationId: UUID, interviewId: UUID) {
		val interview = get(userId, applicationId, interviewId)
		interviewRepository.delete(interview)
	}

	private fun get(userId: UUID, applicationId: UUID, interviewId: UUID): Interview {
		applicationService.get(userId, applicationId)
		val interview = interviewRepository.findById(interviewId).orElse(null)
		if (interview == null || interview.applicationId != applicationId) {
			throw ResourceNotFoundException("Interview", interviewId)
		}
		return interview
	}
}
