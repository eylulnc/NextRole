package com.nextrole.service

import com.nextrole.domain.Application
import com.nextrole.domain.Contact
import com.nextrole.exception.ApplicationNotFoundException
import com.nextrole.repository.ContactRepository
import com.nextrole.web.dto.CreateContactRequest
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
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
}
