package com.nextrole.service

import com.nextrole.domain.Application
import com.nextrole.domain.Interview
import com.nextrole.exception.ApplicationNotFoundException
import com.nextrole.repository.InterviewRepository
import com.nextrole.web.dto.CreateInterviewRequest
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import java.time.Instant
import java.util.UUID

class InterviewServiceTest {

	private val interviewRepository = mockk<InterviewRepository>()
	private val applicationService = mockk<ApplicationService>()
	private val interviewService = InterviewService(interviewRepository, applicationService)
	private val userId = UUID.randomUUID()
	private val applicationId = UUID.randomUUID()

	@Test
	fun `create saves an interview once ownership is verified`() {
		every { applicationService.get(userId, applicationId) } returns mockk<Application>()
		val savedSlot = slot<Interview>()
		every { interviewRepository.save(capture(savedSlot)) } answers { savedSlot.captured }
		val scheduledAt = Instant.parse("2026-08-20T14:00:00Z")

		val result = interviewService.create(
			userId, applicationId,
			CreateInterviewRequest(round = "Technical Interview", scheduledAt = scheduledAt)
		)

		assertEquals(applicationId, savedSlot.captured.applicationId)
		assertEquals("Technical Interview", result.round)
		assertEquals(scheduledAt, result.scheduledAt)
	}

	@Test
	fun `create throws when the application is not owned by this user`() {
		every { applicationService.get(userId, applicationId) } throws ApplicationNotFoundException(applicationId)

		assertThrows(ApplicationNotFoundException::class.java) {
			interviewService.create(
				userId, applicationId,
				CreateInterviewRequest(round = "Technical Interview", scheduledAt = Instant.now())
			)
		}
		verify(exactly = 0) { interviewRepository.save(any()) }
	}

	@Test
	fun `list returns interviews for an owned application`() {
		every { applicationService.get(userId, applicationId) } returns mockk<Application>()
		val interviews = listOf(Interview(applicationId = applicationId, round = "HR Screen", scheduledAt = Instant.now()))
		every { interviewRepository.findByApplicationIdOrderByScheduledAtAsc(applicationId) } returns interviews

		val result = interviewService.list(userId, applicationId)

		assertEquals(1, result.size)
		assertEquals("HR Screen", result[0].round)
	}
}
