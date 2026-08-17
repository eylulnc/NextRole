package com.nextrole.service

import com.nextrole.domain.Application
import com.nextrole.exception.ApplicationNotFoundException
import com.nextrole.repository.ApplicationRepository
import com.nextrole.web.dto.CreateApplicationRequest
import com.nextrole.web.dto.UpdateApplicationRequest
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import java.time.Instant
import java.util.UUID

@Service
class ApplicationService(
	private val applicationRepository: ApplicationRepository
) {

	fun create(userId: UUID, request: CreateApplicationRequest): Application {
		val application = Application(
			userId = userId,
			company = request.company,
			role = request.role,
			location = request.location,
			salaryMin = request.salaryMin,
			salaryMax = request.salaryMax,
			techStack = request.techStack,
			jobDescription = request.jobDescription,
			applicationDate = request.applicationDate,
			status = request.status,
			notes = request.notes
		)
		return applicationRepository.save(application)
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
		request.salaryMin?.let { application.salaryMin = it }
		request.salaryMax?.let { application.salaryMax = it }
		request.techStack?.let { application.techStack = it }
		request.jobDescription?.let { application.jobDescription = it }
		request.applicationDate?.let { application.applicationDate = it }
		request.status?.let { application.status = it }
		request.notes?.let { application.notes = it }
		application.updatedAt = Instant.now()
		return applicationRepository.save(application)
	}

	fun delete(userId: UUID, id: UUID) {
		val application = get(userId, id)
		applicationRepository.delete(application)
	}
}
