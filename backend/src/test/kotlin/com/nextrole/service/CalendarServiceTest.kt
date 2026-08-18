package com.nextrole.service

import com.nextrole.domain.Application
import com.nextrole.domain.Interview
import com.nextrole.repository.ApplicationRepository
import com.nextrole.repository.InterviewRepository
import io.mockk.every
import io.mockk.mockk
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import java.time.Instant
import java.util.UUID

class CalendarServiceTest {

	private val applicationRepository = mockk<ApplicationRepository>()
	private val interviewRepository = mockk<InterviewRepository>()
	private val calendarService = CalendarService(applicationRepository, interviewRepository)
	private val userId = UUID.randomUUID()

	@Test
	fun `maps every interview to its application's company and role`() {
		val app = Application(userId = userId, company = "Acme", role = "Engineer")
		val pastInterview = Interview(applicationId = app.id, round = "HR Screen", scheduledAt = Instant.parse("2026-01-01T10:00:00Z"))
		val futureInterview = Interview(applicationId = app.id, round = "Technical", scheduledAt = Instant.parse("2026-12-01T10:00:00Z"))
		every { applicationRepository.findByUserId(userId) } returns listOf(app)
		every { interviewRepository.findAllByUserId(userId) } returns listOf(pastInterview, futureInterview)

		val result = calendarService.getInterviews(userId)

		assertEquals(2, result.size)
		assertEquals("Acme", result[0].company)
		assertEquals("HR Screen", result[0].round)
	}

	@Test
	fun `skips interviews whose application no longer exists`() {
		val orphanInterview = Interview(applicationId = UUID.randomUUID(), round = "HR Screen", scheduledAt = Instant.now())
		every { applicationRepository.findByUserId(userId) } returns emptyList()
		every { interviewRepository.findAllByUserId(userId) } returns listOf(orphanInterview)

		val result = calendarService.getInterviews(userId)

		assertEquals(0, result.size)
	}
}
