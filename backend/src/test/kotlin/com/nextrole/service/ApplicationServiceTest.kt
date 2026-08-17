package com.nextrole.service

import com.nextrole.domain.Application
import com.nextrole.domain.ApplicationStatus
import com.nextrole.exception.ApplicationNotFoundException
import com.nextrole.repository.ApplicationRepository
import com.nextrole.web.dto.CreateApplicationRequest
import com.nextrole.web.dto.UpdateApplicationRequest
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import java.util.UUID

class ApplicationServiceTest {

	private val applicationRepository = mockk<ApplicationRepository>()
	private val applicationService = ApplicationService(applicationRepository)
	private val userId = UUID.randomUUID()

	@Test
	fun `create saves an application scoped to the current user`() {
		val savedSlot = slot<Application>()
		every { applicationRepository.save(capture(savedSlot)) } answers { savedSlot.captured }

		val request = CreateApplicationRequest(company = "Acme", role = "Backend Engineer")
		val result = applicationService.create(userId, request)

		assertEquals(userId, savedSlot.captured.userId)
		assertEquals("Acme", result.company)
		assertEquals(ApplicationStatus.SAVED, result.status)
	}

	@Test
	fun `get throws when the application does not exist for this user`() {
		val id = UUID.randomUUID()
		every { applicationRepository.findByIdAndUserId(id, userId) } returns null

		assertThrows(ApplicationNotFoundException::class.java) {
			applicationService.get(userId, id)
		}
	}

	@Test
	fun `update only overwrites fields present in the request`() {
		val existing = Application(userId = userId, company = "Acme", role = "Backend Engineer", location = "Berlin")
		every { applicationRepository.findByIdAndUserId(existing.id, userId) } returns existing
		every { applicationRepository.save(existing) } returns existing

		val result = applicationService.update(
			userId, existing.id,
			UpdateApplicationRequest(status = ApplicationStatus.APPLIED)
		)

		assertEquals("Acme", result.company)
		assertEquals("Berlin", result.location)
		assertEquals(ApplicationStatus.APPLIED, result.status)
	}

	@Test
	fun `delete removes the application when owned by the user`() {
		val existing = Application(userId = userId, company = "Acme", role = "Backend Engineer")
		every { applicationRepository.findByIdAndUserId(existing.id, userId) } returns existing
		every { applicationRepository.delete(existing) } returns Unit

		applicationService.delete(userId, existing.id)
	}
}
