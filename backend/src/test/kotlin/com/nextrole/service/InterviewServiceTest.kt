package com.nextrole.service

import com.nextrole.domain.Application
import com.nextrole.domain.Interview
import com.nextrole.exception.ApplicationNotFoundException
import com.nextrole.exception.ResourceNotFoundException
import com.nextrole.repository.InterviewRepository
import com.nextrole.web.dto.CreateInterviewRequest
import com.nextrole.web.dto.UpdateInterviewRequest
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import java.time.Instant
import java.util.Optional
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

	@Test
	fun `update changes only the provided fields`() {
		val interviewId = UUID.randomUUID()
		val interview = Interview(id = interviewId, applicationId = applicationId, round = "HR Screen", scheduledAt = Instant.now())
		every { applicationService.get(userId, applicationId) } returns mockk<Application>()
		every { interviewRepository.findById(interviewId) } returns Optional.of(interview)
		every { interviewRepository.save(interview) } returns interview

		val result = interviewService.update(userId, applicationId, interviewId, UpdateInterviewRequest(round = "Technical Interview"))

		assertEquals("Technical Interview", result.round)
	}

	@Test
	fun `update throws when the interview belongs to a different application`() {
		val interviewId = UUID.randomUUID()
		val interview = Interview(id = interviewId, applicationId = UUID.randomUUID(), round = "HR Screen", scheduledAt = Instant.now())
		every { applicationService.get(userId, applicationId) } returns mockk<Application>()
		every { interviewRepository.findById(interviewId) } returns Optional.of(interview)

		assertThrows(ResourceNotFoundException::class.java) {
			interviewService.update(userId, applicationId, interviewId, UpdateInterviewRequest(round = "Technical Interview"))
		}
	}

	@Test
	fun `delete removes an owned interview`() {
		val interviewId = UUID.randomUUID()
		val interview = Interview(id = interviewId, applicationId = applicationId, round = "HR Screen", scheduledAt = Instant.now())
		every { applicationService.get(userId, applicationId) } returns mockk<Application>()
		every { interviewRepository.findById(interviewId) } returns Optional.of(interview)
		every { interviewRepository.delete(interview) } returns Unit

		interviewService.delete(userId, applicationId, interviewId)

		verify(exactly = 1) { interviewRepository.delete(interview) }
	}
}
