package com.nextrole.service

import com.nextrole.domain.Contact
import com.nextrole.repository.ContactRepository
import com.nextrole.web.dto.CreateContactRequest
import org.springframework.stereotype.Service
import java.util.UUID

@Service
class ContactService(
	private val contactRepository: ContactRepository,
	private val applicationService: ApplicationService
) {

	fun create(userId: UUID, applicationId: UUID, request: CreateContactRequest): Contact {
		applicationService.get(userId, applicationId)
		val contact = Contact(
			applicationId = applicationId,
			name = request.name,
			role = request.role,
			email = request.email
		)
		return contactRepository.save(contact)
	}

	fun list(userId: UUID, applicationId: UUID): List<Contact> {
		applicationService.get(userId, applicationId)
		return contactRepository.findByApplicationIdOrderByCreatedAtAsc(applicationId)
	}
}
