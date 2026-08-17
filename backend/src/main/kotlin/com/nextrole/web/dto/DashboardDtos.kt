package com.nextrole.web.dto

import com.nextrole.domain.ApplicationStatus
import java.time.Instant
import java.util.UUID

data class FunnelStageCount(
	val status: ApplicationStatus,
	val count: Int
)

data class UpcomingInterviewResponse(
	val applicationId: UUID,
	val company: String,
	val role: String,
	val round: String,
	val scheduledAt: Instant
)

data class RecentActivityResponse(
	val applicationId: UUID,
	val company: String,
	val status: ApplicationStatus,
	val changedAt: Instant
)

data class DashboardStatisticsResponse(
	val activeApplications: Int,
	val applicationsAddedThisMonth: Int,
	val interviewsThisWeek: Int,
	val responseRatePercent: Int,
	val avgDaysInPipeline: Int,
	val funnelStages: List<FunnelStageCount>,
	val upcomingInterviews: List<UpcomingInterviewResponse>,
	val recentActivity: List<RecentActivityResponse>
)
