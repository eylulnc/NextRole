package com.nextrole.service

import com.nextrole.domain.Application
import com.nextrole.domain.ApplicationStatusHistory
import com.nextrole.domain.Interview
import com.nextrole.domain.PipelineStage
import com.nextrole.domain.PipelineStageCategory
import com.nextrole.repository.ApplicationRepository
import com.nextrole.repository.ApplicationStatusHistoryRepository
import com.nextrole.repository.InterviewRepository
import com.nextrole.repository.PipelineStageRepository
import io.mockk.every
import io.mockk.mockk
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.time.Instant
import java.time.temporal.ChronoUnit
import java.util.UUID

class DashboardServiceTest {

	private val applicationRepository = mockk<ApplicationRepository>()
	private val interviewRepository = mockk<InterviewRepository>()
	private val statusHistoryRepository = mockk<ApplicationStatusHistoryRepository>()
	private val pipelineStageRepository = mockk<PipelineStageRepository>()
	private val dashboardService = DashboardService(applicationRepository, interviewRepository, statusHistoryRepository, pipelineStageRepository)
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

	private fun application(status: String, daysOld: Long = 0): Application =
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
			application("APPLIED"),
			application("TECHNICAL"),
			application("OFFER"),
			application("REJECTED")
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
			application("SAVED"),
			application("APPLIED"),
			application("HR_INTERVIEW"),
			application("OFFER")
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
		val applications = listOf(application("SAVED"))
		every { applicationRepository.findByUserId(userId) } returns applications
		every { interviewRepository.findUpcomingByUserId(userId, any()) } returns emptyList()
		every { statusHistoryRepository.findRecentByUserId(userId) } returns emptyList()

		val result = dashboardService.getStatistics(userId)

		assertEquals(0, result.responseRatePercent)
	}

	@Test
	fun `computes average days in pipeline across active applications`() {
		val applications = listOf(
			application("APPLIED", daysOld = 10),
			application("APPLIED", daysOld = 20)
		)
		every { applicationRepository.findByUserId(userId) } returns applications
		every { interviewRepository.findUpcomingByUserId(userId, any()) } returns emptyList()
		every { statusHistoryRepository.findRecentByUserId(userId) } returns emptyList()

		val result = dashboardService.getStatistics(userId)

		assertEquals(15, result.avgDaysInPipeline)
	}

	@Test
	fun `builds funnel counts across all statuses`() {
		val applications = listOf(application("APPLIED"), application("APPLIED"))
		every { applicationRepository.findByUserId(userId) } returns applications
		every { interviewRepository.findUpcomingByUserId(userId, any()) } returns emptyList()
		every { statusHistoryRepository.findRecentByUserId(userId) } returns emptyList()

		val result = dashboardService.getStatistics(userId)

		assertEquals(defaultStages.size, result.funnelStages.size)
		assertEquals(2, result.funnelStages.first { it.status == "APPLIED" }.count)
	}

	@Test
	fun `excludes hidden stages from the funnel`() {
		val hiddenStage = PipelineStage(userId = userId, key = "OLD_STAGE", label = "Old Stage", orderIndex = 7, hue = 0, category = PipelineStageCategory.ACTIVE, visible = false)
		every { pipelineStageRepository.findByUserIdOrderByOrderIndexAsc(userId) } returns defaultStages + hiddenStage
		every { applicationRepository.findByUserId(userId) } returns emptyList()
		every { interviewRepository.findUpcomingByUserId(userId, any()) } returns emptyList()
		every { statusHistoryRepository.findRecentByUserId(userId) } returns emptyList()

		val result = dashboardService.getStatistics(userId)

		assertEquals(defaultStages.size, result.funnelStages.size)
		assert(result.funnelStages.none { it.status == "OLD_STAGE" })
	}

	@Test
	fun `maps upcoming interviews to their application's company and role`() {
		val app = application("TECHNICAL")
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
	fun `maps upcoming interview mode, duration, and meeting link`() {
		val app = application("TECHNICAL")
		val interview = Interview(
			applicationId = app.id,
			round = "Technical",
			scheduledAt = Instant.now().plus(2, ChronoUnit.DAYS),
			mode = "Video call",
			durationMinutes = 45,
			meetingLink = "https://meet.example.com/room"
		)
		every { applicationRepository.findByUserId(userId) } returns listOf(app)
		every { interviewRepository.findUpcomingByUserId(userId, any()) } returns listOf(interview)
		every { statusHistoryRepository.findRecentByUserId(userId) } returns emptyList()

		val result = dashboardService.getStatistics(userId)

		assertEquals("Video call", result.upcomingInterviews[0].mode)
		assertEquals(45, result.upcomingInterviews[0].durationMinutes)
		assertEquals("https://meet.example.com/room", result.upcomingInterviews[0].meetingLink)
	}

	@Test
	fun `attaches conflicts for interviews beyond the returned limit`() {
		val app = application("TECHNICAL")
		// Seven upcoming interviews, only five returned. The clash is between the fifth (returned)
		// and the sixth (cut off) — exactly what a client-side check over the returned slice misses.
		val scheduled = (1..5).map { Instant.now().plus(it.toLong(), ChronoUnit.DAYS) }
		val returned = scheduled.mapIndexed { index, at ->
			Interview(applicationId = app.id, round = "Round $index", scheduledAt = at, durationMinutes = 60)
		}
		val beyondLimit = Interview(
			applicationId = app.id,
			round = "Overlaps the fifth",
			scheduledAt = scheduled.last().plus(30, ChronoUnit.MINUTES),
			durationMinutes = 60
		)
		val alsoBeyondLimit = Interview(
			applicationId = app.id,
			round = "Later still",
			scheduledAt = scheduled.last().plus(10, ChronoUnit.DAYS),
			durationMinutes = 60
		)
		every { applicationRepository.findByUserId(userId) } returns listOf(app)
		every { interviewRepository.findUpcomingByUserId(userId, any()) } returns
			returned + beyondLimit + alsoBeyondLimit
		every { statusHistoryRepository.findRecentByUserId(userId) } returns emptyList()

		val result = dashboardService.getStatistics(userId)

		assertEquals(5, result.upcomingInterviews.size)
		assertEquals(beyondLimit.id, result.upcomingInterviews.last().conflictsWith?.id)
		assertEquals("Acme", result.upcomingInterviews.last().conflictsWith?.company)
	}

	@Test
	fun `leaves conflictsWith null when no interviews overlap`() {
		val app = application("TECHNICAL")
		val interviews = (0 until 2).map { index ->
			Interview(
				applicationId = app.id,
				round = "Round $index",
				scheduledAt = Instant.now().plus((index + 1).toLong(), ChronoUnit.DAYS),
				durationMinutes = 60
			)
		}
		every { applicationRepository.findByUserId(userId) } returns listOf(app)
		every { interviewRepository.findUpcomingByUserId(userId, any()) } returns interviews
		every { statusHistoryRepository.findRecentByUserId(userId) } returns emptyList()

		val result = dashboardService.getStatistics(userId)

		assertEquals(listOf(null, null), result.upcomingInterviews.map { it.conflictsWith })
	}

	@Test
	fun `maps recent activity to their application's company`() {
		val app = application("APPLIED")
		val entry = ApplicationStatusHistory(applicationId = app.id, status = "APPLIED")
		every { applicationRepository.findByUserId(userId) } returns listOf(app)
		every { interviewRepository.findUpcomingByUserId(userId, any()) } returns emptyList()
		every { statusHistoryRepository.findRecentByUserId(userId) } returns listOf(entry)

		val result = dashboardService.getStatistics(userId)

		assertEquals(1, result.recentActivity.size)
		assertEquals("Acme", result.recentActivity[0].company)
	}
}
