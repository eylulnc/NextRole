package com.nextrole.service

import com.nextrole.domain.Application
import com.nextrole.domain.Contact
import com.nextrole.exception.ApplicationNotFoundException
import com.nextrole.exception.ResourceNotFoundException
import com.nextrole.repository.ContactRepository
import com.nextrole.web.dto.CreateContactRequest
import com.nextrole.web.dto.UpdateContactRequest
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import java.util.Optional
import java.util.UUID

class ContactServiceTest {

	private val contactRepository = mockk<ContactRepository>()
	private val applicationService = mockk<ApplicationService>()
	private val contactService = ContactService(contactRepository, applicationService)
	private val userId = UUID.randomUUID()
	private val applicationId = UUID.randomUUID()

	@Test
	fun `create saves a contact once ownership is verified`() {
		every { applicationService.get(userId, applicationId) } returns mockk<Application>()
		val savedSlot = slot<Contact>()
		every { contactRepository.save(capture(savedSlot)) } answers { savedSlot.captured }

		val result = contactService.create(
			userId, applicationId,
			CreateContactRequest(name = "Lena Fischer", role = "Talent Partner")
		)

		assertEquals(applicationId, savedSlot.captured.applicationId)
		assertEquals("Lena Fischer", result.name)
	}

	@Test
	fun `create throws when the application is not owned by this user`() {
		every { applicationService.get(userId, applicationId) } throws ApplicationNotFoundException(applicationId)

		assertThrows(ApplicationNotFoundException::class.java) {
			contactService.create(userId, applicationId, CreateContactRequest(name = "Lena Fischer"))
		}
		verify(exactly = 0) { contactRepository.save(any()) }
	}

	@Test
	fun `list returns contacts for an owned application`() {
		every { applicationService.get(userId, applicationId) } returns mockk<Application>()
		val contacts = listOf(Contact(applicationId = applicationId, name = "Lena Fischer"))
		every { contactRepository.findByApplicationIdOrderByCreatedAtAsc(applicationId) } returns contacts

		val result = contactService.list(userId, applicationId)

		assertEquals(1, result.size)
		assertEquals("Lena Fischer", result[0].name)
	}

	@Test
	fun `update changes only the provided fields`() {
		val contactId = UUID.randomUUID()
		val contact = Contact(id = contactId, applicationId = applicationId, name = "Lena Fischer")
		every { applicationService.get(userId, applicationId) } returns mockk<Application>()
		every { contactRepository.findById(contactId) } returns Optional.of(contact)
		every { contactRepository.save(contact) } returns contact

		val result = contactService.update(userId, applicationId, contactId, UpdateContactRequest(role = "Recruiter"))

		assertEquals("Recruiter", result.role)
		assertEquals("Lena Fischer", result.name)
	}

	@Test
	fun `update throws when the contact belongs to a different application`() {
		val contactId = UUID.randomUUID()
		val contact = Contact(id = contactId, applicationId = UUID.randomUUID(), name = "Lena Fischer")
		every { applicationService.get(userId, applicationId) } returns mockk<Application>()
		every { contactRepository.findById(contactId) } returns Optional.of(contact)

		assertThrows(ResourceNotFoundException::class.java) {
			contactService.update(userId, applicationId, contactId, UpdateContactRequest(role = "Recruiter"))
		}
	}

	@Test
	fun `delete removes an owned contact`() {
		val contactId = UUID.randomUUID()
		val contact = Contact(id = contactId, applicationId = applicationId, name = "Lena Fischer")
		every { applicationService.get(userId, applicationId) } returns mockk<Application>()
		every { contactRepository.findById(contactId) } returns Optional.of(contact)
		every { contactRepository.delete(contact) } returns Unit

		contactService.delete(userId, applicationId, contactId)

		verify(exactly = 1) { contactRepository.delete(contact) }
	}
}
