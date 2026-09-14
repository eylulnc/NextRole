package com.nextrole.web.dto

import java.time.Instant
import java.util.UUID

data class FunnelStageCount(
	val status: String,
	val count: Int
)

data class UpcomingInterviewResponse(
	val id: UUID,
	val applicationId: UUID,
	val company: String,
	val role: String,
	val round: String,
	val scheduledAt: Instant,
	val mode: String? = null,
	val durationMinutes: Int? = null,
	val meetingLink: String? = null
)

data class RecentActivityResponse(
	val applicationId: UUID,
	val company: String,
	val status: String,
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
