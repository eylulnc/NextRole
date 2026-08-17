package com.nextrole.service

import com.nextrole.domain.Application
import com.nextrole.domain.ApplicationStatus
import com.nextrole.domain.ApplicationStatusHistory
import com.nextrole.domain.Interview
import com.nextrole.repository.ApplicationRepository
import com.nextrole.repository.ApplicationStatusHistoryRepository
import com.nextrole.repository.InterviewRepository
import io.mockk.every
import io.mockk.mockk
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.UUID

class DashboardServiceTest {

	private val applicationRepository = mockk<ApplicationRepository>()
	private val interviewRepository = mockk<InterviewRepository>()
	private val statusHistoryRepository = mockk<ApplicationStatusHistoryRepository>()
	private val dashboardService = DashboardService(applicationRepository, interviewRepository, statusHistoryRepository)
	private val userId = UUID.randomUUID()

	private fun application(status: ApplicationStatus, daysOld: Long = 0): Application =
		Application(
			userId = userId,
			company = "Acme",
			role = "Engineer",
			status = status,
			createdAt = Instant.now().minus(daysOld, ChronoUnit.DAYS)
		)

	@Test
	fun `counts active applications excluding terminal statuses`() {
		val applications = listOf(
			application(ApplicationStatus.APPLIED),
			application(ApplicationStatus.TECHNICAL),
			application(ApplicationStatus.OFFER),
			application(ApplicationStatus.REJECTED)
		)
		every { applicationRepository.findByUserId(userId) } returns applications
		every { interviewRepository.findUpcomingByUserId(userId, any()) } returns emptyList()
		every { statusHistoryRepository.findRecentByUserId(userId) } returns emptyList()

		val result = dashboardService.getStatistics(userId)

		assertEquals(2, result.activeApplications)
	}

	@Test
	fun `computes response rate as applications past applied out of all applied`() {
		val applications = listOf(
			application(ApplicationStatus.SAVED),
			application(ApplicationStatus.APPLIED),
			application(ApplicationStatus.HR_INTERVIEW),
			application(ApplicationStatus.OFFER)
		)
		every { applicationRepository.findByUserId(userId) } returns applications
		every { interviewRepository.findUpcomingByUserId(userId, any()) } returns emptyList()
		every { statusHistoryRepository.findRecentByUserId(userId) } returns emptyList()

		val result = dashboardService.getStatistics(userId)

		// 3 applications reached beyond SAVED (APPLIED, HR_INTERVIEW, OFFER); 2 of them moved past APPLIED
		assertEquals(66, result.responseRatePercent)
	}

	@Test
	fun `returns zero response rate when nothing has been applied to yet`() {
		val applications = listOf(application(ApplicationStatus.SAVED))
		every { applicationRepository.findByUserId(userId) } returns applications
		every { interviewRepository.findUpcomingByUserId(userId, any()) } returns emptyList()
		every { statusHistoryRepository.findRecentByUserId(userId) } returns emptyList()

		val result = dashboardService.getStatistics(userId)

		assertEquals(0, result.responseRatePercent)
	}

	@Test
	fun `computes average days in pipeline across active applications`() {
		val applications = listOf(
			application(ApplicationStatus.APPLIED, daysOld = 10),
			application(ApplicationStatus.APPLIED, daysOld = 20)
		)
		every { applicationRepository.findByUserId(userId) } returns applications
		every { interviewRepository.findUpcomingByUserId(userId, any()) } returns emptyList()
		every { statusHistoryRepository.findRecentByUserId(userId) } returns emptyList()

		val result = dashboardService.getStatistics(userId)

		assertEquals(15, result.avgDaysInPipeline)
	}

	@Test
	fun `builds funnel counts across all statuses`() {
		val applications = listOf(application(ApplicationStatus.APPLIED), application(ApplicationStatus.APPLIED))
		every { applicationRepository.findByUserId(userId) } returns applications
		every { interviewRepository.findUpcomingByUserId(userId, any()) } returns emptyList()
		every { statusHistoryRepository.findRecentByUserId(userId) } returns emptyList()

		val result = dashboardService.getStatistics(userId)

		assertEquals(ApplicationStatus.entries.size, result.funnelStages.size)
		assertEquals(2, result.funnelStages.first { it.status == ApplicationStatus.APPLIED }.count)
	}

	@Test
	fun `maps upcoming interviews to their application's company and role`() {
		val app = application(ApplicationStatus.TECHNICAL)
		val interview = Interview(applicationId = app.id, round = "Technical", scheduledAt = Instant.now().plus(2, ChronoUnit.DAYS))
		every { applicationRepository.findByUserId(userId) } returns listOf(app)
		every { interviewRepository.findUpcomingByUserId(userId, any()) } returns listOf(interview)
		every { statusHistoryRepository.findRecentByUserId(userId) } returns emptyList()

		val result = dashboardService.getStatistics(userId)

		assertEquals(1, result.upcomingInterviews.size)
		assertEquals("Acme", result.upcomingInterviews[0].company)
		assertEquals(1, result.interviewsThisWeek)
	}

	@Test
	fun `maps recent activity to their application's company`() {
		val app = application(ApplicationStatus.APPLIED)
		val entry = ApplicationStatusHistory(applicationId = app.id, status = ApplicationStatus.APPLIED)
		every { applicationRepository.findByUserId(userId) } returns listOf(app)
		every { interviewRepository.findUpcomingByUserId(userId, any()) } returns emptyList()
		every { statusHistoryRepository.findRecentByUserId(userId) } returns listOf(entry)

		val result = dashboardService.getStatistics(userId)

		assertEquals(1, result.recentActivity.size)
		assertEquals("Acme", result.recentActivity[0].company)
	}
}
