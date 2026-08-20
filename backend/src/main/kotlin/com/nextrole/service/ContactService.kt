package com.nextrole.service

import com.nextrole.domain.Contact
import com.nextrole.exception.ResourceNotFoundException
import com.nextrole.repository.ContactRepository
import com.nextrole.web.dto.CreateContactRequest
import com.nextrole.web.dto.UpdateContactRequest
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

	fun update(userId: UUID, applicationId: UUID, contactId: UUID, request: UpdateContactRequest): Contact {
		val contact = get(userId, applicationId, contactId)
		request.name?.let { contact.name = it }
		request.role?.let { contact.role = it }
		request.email?.let { contact.email = it }
		return contactRepository.save(contact)
	}

	fun delete(userId: UUID, applicationId: UUID, contactId: UUID) {
		val contact = get(userId, applicationId, contactId)
		contactRepository.delete(contact)
	}

	private fun get(userId: UUID, applicationId: UUID, contactId: UUID): Contact {
		applicationService.get(userId, applicationId)
		val contact = contactRepository.findById(contactId).orElse(null)
		if (contact == null || contact.applicationId != applicationId) {
			throw ResourceNotFoundException("Contact", contactId)
		}
		return contact
	}
}
