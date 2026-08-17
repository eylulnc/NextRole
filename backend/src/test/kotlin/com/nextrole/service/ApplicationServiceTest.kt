package com.nextrole.service

import com.nextrole.domain.Application
import com.nextrole.domain.ApplicationStatus
import com.nextrole.domain.ApplicationStatusHistory
import com.nextrole.exception.ApplicationNotFoundException
import com.nextrole.repository.ApplicationRepository
import com.nextrole.repository.ApplicationStatusHistoryRepository
import com.nextrole.web.dto.CreateApplicationRequest
import com.nextrole.web.dto.UpdateApplicationRequest
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import java.util.UUID

class ApplicationServiceTest {

	private val applicationRepository = mockk<ApplicationRepository>()
	private val statusHistoryRepository = mockk<ApplicationStatusHistoryRepository>()
	private val applicationService = ApplicationService(applicationRepository, statusHistoryRepository)
	private val userId = UUID.randomUUID()

	@Test
	fun `create saves an application scoped to the current user and records initial status`() {
		val savedSlot = slot<Application>()
		every { applicationRepository.save(capture(savedSlot)) } answers { savedSlot.captured }
		val historySlot = slot<ApplicationStatusHistory>()
		every { statusHistoryRepository.save(capture(historySlot)) } answers { historySlot.captured }

		val request = CreateApplicationRequest(company = "Acme", role = "Backend Engineer")
		val result = applicationService.create(userId, request)

		assertEquals(userId, savedSlot.captured.userId)
		assertEquals("Acme", result.company)
		assertEquals(ApplicationStatus.SAVED, result.status)
		assertEquals(ApplicationStatus.SAVED, historySlot.captured.status)
		assertEquals(result.id, historySlot.captured.applicationId)
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
		every { statusHistoryRepository.save(any()) } returns mockk()

		val result = applicationService.update(
			userId, existing.id,
			UpdateApplicationRequest(status = ApplicationStatus.APPLIED)
		)

		assertEquals("Acme", result.company)
		assertEquals("Berlin", result.location)
		assertEquals(ApplicationStatus.APPLIED, result.status)
	}

	@Test
	fun `update does not record a history entry when the status is unchanged`() {
		val existing = Application(userId = userId, company = "Acme", role = "Backend Engineer", status = ApplicationStatus.APPLIED)
		every { applicationRepository.findByIdAndUserId(existing.id, userId) } returns existing
		every { applicationRepository.save(existing) } returns existing

		applicationService.update(userId, existing.id, UpdateApplicationRequest(status = ApplicationStatus.APPLIED))

		verify(exactly = 0) { statusHistoryRepository.save(any()) }
	}

	@Test
	fun `changeStatus updates the application and records history`() {
		val existing = Application(userId = userId, company = "Acme", role = "Backend Engineer", status = ApplicationStatus.SAVED)
		every { applicationRepository.findByIdAndUserId(existing.id, userId) } returns existing
		every { applicationRepository.save(existing) } returns existing
		val historySlot = slot<ApplicationStatusHistory>()
		every { statusHistoryRepository.save(capture(historySlot)) } answers { historySlot.captured }

		val result = applicationService.changeStatus(userId, existing.id, ApplicationStatus.APPLIED)

		assertEquals(ApplicationStatus.APPLIED, result.status)
		assertEquals(ApplicationStatus.APPLIED, historySlot.captured.status)
	}

	@Test
	fun `getHistory returns entries ordered by change time`() {
		val existing = Application(userId = userId, company = "Acme", role = "Backend Engineer")
		every { applicationRepository.findByIdAndUserId(existing.id, userId) } returns existing
		val entries = listOf(ApplicationStatusHistory(applicationId = existing.id, status = ApplicationStatus.SAVED))
		every { statusHistoryRepository.findByApplicationIdOrderByChangedAtAsc(existing.id) } returns entries

		val result = applicationService.getHistory(userId, existing.id)

		assertEquals(1, result.size)
		assertEquals(ApplicationStatus.SAVED, result[0].status)
	}

	@Test
	fun `delete removes the application when owned by the user`() {
		val existing = Application(userId = userId, company = "Acme", role = "Backend Engineer")
		every { applicationRepository.findByIdAndUserId(existing.id, userId) } returns existing
		every { applicationRepository.delete(existing) } returns Unit

		applicationService.delete(userId, existing.id)
	}
}
