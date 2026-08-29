package com.nextrole.service

import com.nextrole.domain.PipelineStageCategory
import com.nextrole.repository.ApplicationRepository
import com.nextrole.repository.ApplicationStatusHistoryRepository
import com.nextrole.repository.InterviewRepository
import com.nextrole.repository.PipelineStageRepository
import com.nextrole.web.dto.DashboardStatisticsResponse
import com.nextrole.web.dto.FunnelStageCount
import com.nextrole.web.dto.RecentActivityResponse
import com.nextrole.web.dto.UpcomingInterviewResponse
import org.springframework.stereotype.Service
import java.time.Duration
import java.time.Instant
import java.time.YearMonth
import java.time.ZoneOffset
import java.util.UUID

private const val RECENT_ACTIVITY_LIMIT = 5
private const val UPCOMING_INTERVIEWS_LIMIT = 5

@Service
class DashboardService(
	private val applicationRepository: ApplicationRepository,
	private val interviewRepository: InterviewRepository,
	private val statusHistoryRepository: ApplicationStatusHistoryRepository,
	private val pipelineStageRepository: PipelineStageRepository
) {

	fun getStatistics(userId: UUID): DashboardStatisticsResponse {
		val applications = applicationRepository.findByUserId(userId)
		val applicationsById = applications.associateBy { it.id }
		val now = Instant.now()

		val stages = pipelineStageRepository.findByUserIdOrderByOrderIndexAsc(userId).filter { it.visible }
		val terminalKeys = stages.filter { it.category == PipelineStageCategory.TERMINAL }.map { it.key }.toSet()
		val preResponseKeys = stages.filter { it.category == PipelineStageCategory.PRE_RESPONSE }.map { it.key }.toSet()

		val activeApplications = applications.filter { it.status !in terminalKeys }

		val startOfMonth = YearMonth.now().atDay(1).atStartOfDay(ZoneOffset.UTC).toInstant()
		val applicationsAddedThisMonth = applications.count { it.createdAt >= startOfMonth }

		val upcomingInterviews = interviewRepository.findUpcomingByUserId(userId, now)
		val interviewsThisWeek = upcomingInterviews.count { it.scheduledAt <= now.plus(Duration.ofDays(7)) }

		// "SAVED" specifically means "not yet applied" — distinct from the broader PRE_RESPONSE
		// category. SAVED is a built-in stage that can never be deleted, so this is safe long-term.
		val applied = applications.filter { it.status != "SAVED" }
		val responded = applied.filter { it.status !in preResponseKeys }
		val responseRatePercent = if (applied.isEmpty()) 0 else (responded.size * 100) / applied.size

		val avgDaysInPipeline = if (activeApplications.isEmpty()) {
			0
		} else {
			activeApplications
				.map { Duration.between(it.createdAt, now).toDays() }
				.average()
				.toInt()
		}

		val funnelStages = stages.map { stage ->
			FunnelStageCount(status = stage.key, count = applications.count { it.status == stage.key })
		}

		val upcomingInterviewsResponse = upcomingInterviews.take(UPCOMING_INTERVIEWS_LIMIT).mapNotNull { interview ->
			val application = applicationsById[interview.applicationId] ?: return@mapNotNull null
			UpcomingInterviewResponse(
				applicationId = interview.applicationId,
				company = application.company,
				role = application.role,
				round = interview.round,
				scheduledAt = interview.scheduledAt,
				mode = interview.mode,
				durationMinutes = interview.durationMinutes,
				meetingLink = interview.meetingLink
			)
		}

		val recentActivity = statusHistoryRepository.findRecentByUserId(userId)
			.take(RECENT_ACTIVITY_LIMIT)
			.mapNotNull { entry ->
				val application = applicationsById[entry.applicationId] ?: return@mapNotNull null
				RecentActivityResponse(
					applicationId = entry.applicationId,
					company = application.company,
					status = entry.status,
					changedAt = entry.changedAt
				)
			}

		return DashboardStatisticsResponse(
			activeApplications = activeApplications.size,
			applicationsAddedThisMonth = applicationsAddedThisMonth,
			interviewsThisWeek = interviewsThisWeek,
			responseRatePercent = responseRatePercent,
			avgDaysInPipeline = avgDaysInPipeline,
			funnelStages = funnelStages,
			upcomingInterviews = upcomingInterviewsResponse,
			recentActivity = recentActivity
		)
	}
}
