package com.nextrole.service

import com.nextrole.domain.Application
import com.nextrole.domain.ApplicationStatusHistory
import com.nextrole.domain.PipelineStage
import com.nextrole.domain.PipelineStageCategory
import com.nextrole.repository.ApplicationRepository
import com.nextrole.repository.ApplicationStatusHistoryRepository
import com.nextrole.repository.PipelineStageRepository
import io.mockk.every
import io.mockk.mockk
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.time.Instant
import java.time.LocalDate
import java.time.YearMonth
import java.time.temporal.ChronoUnit
import java.util.UUID

class AnalyticsServiceTest {

	private val applicationRepository = mockk<ApplicationRepository>()
	private val statusHistoryRepository = mockk<ApplicationStatusHistoryRepository>()
	private val pipelineStageRepository = mockk<PipelineStageRepository>()
	private val analyticsService = AnalyticsService(applicationRepository, statusHistoryRepository, pipelineStageRepository)
	private val userId = UUID.randomUUID()

	private val defaultStages = listOf(
		"SAVED" to PipelineStageCategory.PRE_RESPONSE,
		"APPLIED" to PipelineStageCategory.PRE_RESPONSE,
		"HR_INTERVIEW" to PipelineStageCategory.ACTIVE,
		"TECHNICAL" to PipelineStageCategory.ACTIVE,
		"FINAL" to PipelineStageCategory.ACTIVE,
		"OFFER" to PipelineStageCategory.TERMINAL,
		"REJECTED" to PipelineStageCategory.TERMINAL
	).mapIndexed { index, (key, category) ->
		PipelineStage(userId = userId, key = key, label = key, orderIndex = index, hue = 0, category = category)
	}

	@BeforeEach
	fun setUp() {
		every { pipelineStageRepository.findByUserIdOrderByOrderIndexAsc(userId) } returns defaultStages
	}

	private fun application(
		status: String,
		techStack: String? = null,
		workMode: String? = null,
		daysOld: Long = 0,
		applicationDate: LocalDate? = null
	): Application =
		Application(
			userId = userId,
			company = "Acme",
			role = "Engineer",
			status = status,
			techStack = techStack,
			workMode = workMode,
			applicationDate = applicationDate,
			createdAt = Instant.now().minus(daysOld, ChronoUnit.DAYS)
		)

	@Test
	fun `builds funnel counts across all statuses`() {
		val applications = listOf(application("APPLIED"), application("APPLIED"))
		every { applicationRepository.findByUserId(userId) } returns applications
		every { statusHistoryRepository.findAllByUserIdOrderByApplicationAndTime(userId) } returns emptyList()

		val result = analyticsService.getAnalytics(userId)

		assertEquals(defaultStages.size, result.funnelStages.size)
		assertEquals(2, result.funnelStages.first { it.status == "APPLIED" }.count)
	}

	@Test
	fun `excludes hidden stages from the funnel and conversion rates`() {
		val hiddenStage = PipelineStage(userId = userId, key = "OLD_STAGE", label = "Old Stage", orderIndex = 7, hue = 0, category = PipelineStageCategory.ACTIVE, visible = false)
		every { pipelineStageRepository.findByUserIdOrderByOrderIndexAsc(userId) } returns defaultStages + hiddenStage
		every { applicationRepository.findByUserId(userId) } returns emptyList()
		every { statusHistoryRepository.findAllByUserIdOrderByApplicationAndTime(userId) } returns emptyList()

		val result = analyticsService.getAnalytics(userId)

		assertEquals(defaultStages.size, result.funnelStages.size)
		assertEquals(defaultStages.size, result.stageConversionRates.size)
		assert(result.funnelStages.none { it.status == "OLD_STAGE" })
	}

	@Test
	fun `buckets applications by application date when set`() {
		val threeMonthsAgo = YearMonth.now().minusMonths(3)
		val applications = listOf(application("APPLIED", applicationDate = threeMonthsAgo.atDay(15)))
		every { applicationRepository.findByUserId(userId) } returns applications
		every { statusHistoryRepository.findAllByUserIdOrderByApplicationAndTime(userId) } returns emptyList()

		val result = analyticsService.getAnalytics(userId)

		assertEquals(6, result.applicationsOverTime.size)
		assertEquals(1, result.applicationsOverTime.first { it.month == threeMonthsAgo.toString() }.count)
	}

	@Test
	fun `falls back to creation month when application date is not set`() {
		val applications = listOf(application("APPLIED", daysOld = 0))
		every { applicationRepository.findByUserId(userId) } returns applications
		every { statusHistoryRepository.findAllByUserIdOrderByApplicationAndTime(userId) } returns emptyList()

		val result = analyticsService.getAnalytics(userId)

		assertEquals(1, result.applicationsOverTime.last().count)
	}

	@Test
	fun `excludes applications still in the saved stage from applications over time`() {
		val applications = listOf(
			application("SAVED", daysOld = 0),
			application("HR_INTERVIEW", daysOld = 0)
		)
		every { applicationRepository.findByUserId(userId) } returns applications
		every { statusHistoryRepository.findAllByUserIdOrderByApplicationAndTime(userId) } returns emptyList()

		val result = analyticsService.getAnalytics(userId)

		assertEquals(1, result.applicationsOverTime.last().count)
	}

	@Test
	fun `counts top technologies across comma-separated tech stacks`() {
		val applications = listOf(
			application("APPLIED", techStack = "Kotlin, React"),
			application("APPLIED", techStack = "Kotlin, Postgres")
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
			ApplicationStatusHistory(applicationId = advancedApp, status = "SAVED", changedAt = Instant.now().minus(10, ChronoUnit.DAYS)),
			ApplicationStatusHistory(applicationId = advancedApp, status = "APPLIED", changedAt = Instant.now().minus(4, ChronoUnit.DAYS)),
			ApplicationStatusHistory(applicationId = stalledApp, status = "SAVED", changedAt = Instant.now().minus(2, ChronoUnit.DAYS))
		)
		every { applicationRepository.findByUserId(userId) } returns emptyList()
		every { statusHistoryRepository.findAllByUserIdOrderByApplicationAndTime(userId) } returns history

		val result = analyticsService.getAnalytics(userId)

		// 2 applications entered SAVED, only 1 advanced past it
		assertEquals(50, result.stageConversionRates.first { it.status == "SAVED" }.conversionRatePercent)
		// 1 application entered APPLIED, none advanced past it yet
		assertEquals(0, result.stageConversionRates.first { it.status == "APPLIED" }.conversionRatePercent)
	}

	@Test
	fun `returns zero conversion rate for a stage nothing has entered`() {
		every { applicationRepository.findByUserId(userId) } returns emptyList()
		every { statusHistoryRepository.findAllByUserIdOrderByApplicationAndTime(userId) } returns emptyList()

		val result = analyticsService.getAnalytics(userId)

		assertEquals(0, result.stageConversionRates.first { it.status == "OFFER" }.conversionRatePercent)
	}

	@Test
	fun `counts applications by work mode`() {
		val applications = listOf(
			application("APPLIED", workMode = "REMOTE"),
			application("APPLIED", workMode = "REMOTE"),
			application("APPLIED", workMode = "ONSITE"),
			application("APPLIED", workMode = null)
		)
		every { applicationRepository.findByUserId(userId) } returns applications
		every { statusHistoryRepository.findAllByUserIdOrderByApplicationAndTime(userId) } returns emptyList()

		val result = analyticsService.getAnalytics(userId)

		assertEquals(2, result.applicationsByWorkMode.first { it.workMode == "REMOTE" }.count)
		assertEquals(1, result.applicationsByWorkMode.first { it.workMode == "ONSITE" }.count)
		assertEquals(0, result.applicationsByWorkMode.first { it.workMode == "HYBRID" }.count)
	}
}
