package com.nextrole.service

import com.nextrole.domain.Application
import com.nextrole.domain.ApplicationStatus
import com.nextrole.domain.ApplicationStatusHistory
import com.nextrole.repository.ApplicationRepository
import com.nextrole.repository.ApplicationStatusHistoryRepository
import io.mockk.every
import io.mockk.mockk
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.UUID

class AnalyticsServiceTest {

	private val applicationRepository = mockk<ApplicationRepository>()
	private val statusHistoryRepository = mockk<ApplicationStatusHistoryRepository>()
	private val analyticsService = AnalyticsService(applicationRepository, statusHistoryRepository)
	private val userId = UUID.randomUUID()

	private fun application(status: ApplicationStatus, techStack: String? = null, daysOld: Long = 0): Application =
		Application(
			userId = userId,
			company = "Acme",
			role = "Engineer",
			status = status,
			techStack = techStack,
			createdAt = Instant.now().minus(daysOld, ChronoUnit.DAYS)
		)

	@Test
	fun `builds funnel counts across all statuses`() {
		val applications = listOf(application(ApplicationStatus.APPLIED), application(ApplicationStatus.APPLIED))
		every { applicationRepository.findByUserId(userId) } returns applications
		every { statusHistoryRepository.findAllByUserIdOrderByApplicationAndTime(userId) } returns emptyList()

		val result = analyticsService.getAnalytics(userId)

		assertEquals(ApplicationStatus.entries.size, result.funnelStages.size)
		assertEquals(2, result.funnelStages.first { it.status == ApplicationStatus.APPLIED }.count)
	}

	@Test
	fun `buckets applications into their creation month`() {
		val applications = listOf(application(ApplicationStatus.APPLIED, daysOld = 0))
		every { applicationRepository.findByUserId(userId) } returns applications
		every { statusHistoryRepository.findAllByUserIdOrderByApplicationAndTime(userId) } returns emptyList()

		val result = analyticsService.getAnalytics(userId)

		assertEquals(6, result.applicationsOverTime.size)
		assertEquals(1, result.applicationsOverTime.last().count)
	}

	@Test
	fun `counts top technologies across comma-separated tech stacks`() {
		val applications = listOf(
			application(ApplicationStatus.APPLIED, techStack = "Kotlin, React"),
			application(ApplicationStatus.APPLIED, techStack = "Kotlin, Postgres")
		)
		every { applicationRepository.findByUserId(userId) } returns applications
		every { statusHistoryRepository.findAllByUserIdOrderByApplicationAndTime(userId) } returns emptyList()

		val result = analyticsService.getAnalytics(userId)

		assertEquals(2, result.topTechnologies.first { it.technology == "Kotlin" }.count)
		assertEquals(1, result.topTechnologies.first { it.technology == "React" }.count)
	}

	@Test
	fun `computes stage conversion rate as applications that advanced past a stage`() {
		val advancedApp = UUID.randomUUID()
		val stalledApp = UUID.randomUUID()
		val history = listOf(
			ApplicationStatusHistory(applicationId = advancedApp, status = ApplicationStatus.SAVED, changedAt = Instant.now().minus(10, ChronoUnit.DAYS)),
			ApplicationStatusHistory(applicationId = advancedApp, status = ApplicationStatus.APPLIED, changedAt = Instant.now().minus(4, ChronoUnit.DAYS)),
			ApplicationStatusHistory(applicationId = stalledApp, status = ApplicationStatus.SAVED, changedAt = Instant.now().minus(2, ChronoUnit.DAYS))
		)
		every { applicationRepository.findByUserId(userId) } returns emptyList()
		every { statusHistoryRepository.findAllByUserIdOrderByApplicationAndTime(userId) } returns history

		val result = analyticsService.getAnalytics(userId)

		// 2 applications entered SAVED, only 1 advanced past it
		assertEquals(50, result.stageConversionRates.first { it.status == ApplicationStatus.SAVED }.conversionRatePercent)
		// 1 application entered APPLIED, none advanced past it yet
		assertEquals(0, result.stageConversionRates.first { it.status == ApplicationStatus.APPLIED }.conversionRatePercent)
	}

	@Test
	fun `returns zero conversion rate for a stage nothing has entered`() {
		every { applicationRepository.findByUserId(userId) } returns emptyList()
		every { statusHistoryRepository.findAllByUserIdOrderByApplicationAndTime(userId) } returns emptyList()

		val result = analyticsService.getAnalytics(userId)

		assertEquals(0, result.stageConversionRates.first { it.status == ApplicationStatus.OFFER }.conversionRatePercent)
	}
}
