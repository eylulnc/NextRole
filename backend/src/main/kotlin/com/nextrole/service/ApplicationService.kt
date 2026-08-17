package com.nextrole.service

import com.nextrole.domain.Application
import com.nextrole.domain.ApplicationStatus
import com.nextrole.domain.ApplicationStatusHistory
import com.nextrole.exception.ApplicationNotFoundException
import com.nextrole.repository.ApplicationRepository
import com.nextrole.repository.ApplicationStatusHistoryRepository
import com.nextrole.web.dto.CreateApplicationRequest
import com.nextrole.web.dto.UpdateApplicationRequest
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import java.time.Instant
import java.util.UUID

@Service
class ApplicationService(
	private val applicationRepository: ApplicationRepository,
	private val statusHistoryRepository: ApplicationStatusHistoryRepository
) {

	fun create(userId: UUID, request: CreateApplicationRequest): Application {
		val application = Application(
			userId = userId,
			company = request.company,
			role = request.role,
			location = request.location,
			workMode = request.workMode,
			salaryMin = request.salaryMin,
			salaryMax = request.salaryMax,
			currency = request.currency,
			techStack = request.techStack,
			jobDescription = request.jobDescription,
			applicationDate = request.applicationDate,
			status = request.status,
			notes = request.notes
		)
		val saved = applicationRepository.save(application)
		recordStatusChange(saved.id, saved.status)
		return saved
	}

	fun list(userId: UUID, pageable: Pageable): Page<Application> =
		applicationRepository.findByUserId(userId, pageable)

	fun get(userId: UUID, id: UUID): Application =
		applicationRepository.findByIdAndUserId(id, userId)
			?: throw ApplicationNotFoundException(id)

	fun update(userId: UUID, id: UUID, request: UpdateApplicationRequest): Application {
		val application = get(userId, id)
		request.company?.let { application.company = it }
		request.role?.let { application.role = it }
		request.location?.let { application.location = it }
		request.workMode?.let { application.workMode = it }
		request.salaryMin?.let { application.salaryMin = it }
		request.salaryMax?.let { application.salaryMax = it }
		request.currency?.let { application.currency = it }
		request.techStack?.let { application.techStack = it }
		request.jobDescription?.let { application.jobDescription = it }
		request.applicationDate?.let { application.applicationDate = it }
		request.notes?.let { application.notes = it }
		if (request.status != null && request.status != application.status) {
			application.status = request.status
			recordStatusChange(application.id, application.status)
		}
		application.updatedAt = Instant.now()
		return applicationRepository.save(application)
	}

	fun changeStatus(userId: UUID, id: UUID, status: ApplicationStatus): Application {
		val application = get(userId, id)
		application.status = status
		application.updatedAt = Instant.now()
		val saved = applicationRepository.save(application)
		recordStatusChange(saved.id, saved.status)
		return saved
	}

	fun getHistory(userId: UUID, id: UUID): List<ApplicationStatusHistory> {
		get(userId, id)
		return statusHistoryRepository.findByApplicationIdOrderByChangedAtAsc(id)
	}

	fun delete(userId: UUID, id: UUID) {
		val application = get(userId, id)
		applicationRepository.delete(application)
	}

	private fun recordStatusChange(applicationId: UUID, status: ApplicationStatus) {
		statusHistoryRepository.save(ApplicationStatusHistory(applicationId = applicationId, status = status))
	}
}
