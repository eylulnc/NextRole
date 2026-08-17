package com.nextrole.service

import com.nextrole.domain.ApplicationStatus
import com.nextrole.repository.ApplicationRepository
import com.nextrole.repository.ApplicationStatusHistoryRepository
import com.nextrole.repository.InterviewRepository
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

private val TERMINAL_STATUSES = setOf(ApplicationStatus.OFFER, ApplicationStatus.REJECTED)
private val PRE_RESPONSE_STATUSES = setOf(ApplicationStatus.SAVED, ApplicationStatus.APPLIED)
private const val RECENT_ACTIVITY_LIMIT = 5
private const val UPCOMING_INTERVIEWS_LIMIT = 5

@Service
class DashboardService(
	private val applicationRepository: ApplicationRepository,
	private val interviewRepository: InterviewRepository,
	private val statusHistoryRepository: ApplicationStatusHistoryRepository
) {

	fun getStatistics(userId: UUID): DashboardStatisticsResponse {
		val applications = applicationRepository.findByUserId(userId)
		val applicationsById = applications.associateBy { it.id }
		val now = Instant.now()

		val activeApplications = applications.filter { it.status !in TERMINAL_STATUSES }

		val startOfMonth = YearMonth.now().atDay(1).atStartOfDay(ZoneOffset.UTC).toInstant()
		val applicationsAddedThisMonth = applications.count { it.createdAt >= startOfMonth }

		val upcomingInterviews = interviewRepository.findUpcomingByUserId(userId, now)
		val interviewsThisWeek = upcomingInterviews.count { it.scheduledAt <= now.plus(Duration.ofDays(7)) }

		val applied = applications.filter { it.status !in setOf(ApplicationStatus.SAVED) }
		val responded = applied.filter { it.status !in PRE_RESPONSE_STATUSES }
		val responseRatePercent = if (applied.isEmpty()) 0 else (responded.size * 100) / applied.size

		val avgDaysInPipeline = if (activeApplications.isEmpty()) {
			0
		} else {
			activeApplications
				.map { Duration.between(it.createdAt, now).toDays() }
				.average()
				.toInt()
		}

		val funnelStages = ApplicationStatus.entries.map { status ->
			FunnelStageCount(status = status, count = applications.count { it.status == status })
		}

		val upcomingInterviewsResponse = upcomingInterviews.take(UPCOMING_INTERVIEWS_LIMIT).mapNotNull { interview ->
			val application = applicationsById[interview.applicationId] ?: return@mapNotNull null
			UpcomingInterviewResponse(
				applicationId = interview.applicationId,
				company = application.company,
				role = application.role,
				round = interview.round,
				scheduledAt = interview.scheduledAt
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
