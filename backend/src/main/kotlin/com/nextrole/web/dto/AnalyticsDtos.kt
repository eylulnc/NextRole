package com.nextrole.web.dto

import com.nextrole.domain.ApplicationStatus

data class MonthlyApplicationCount(
	val month: String,
	val count: Int
)

data class TechnologyCount(
	val technology: String,
	val count: Int
)

data class StageConversionRate(
	val status: ApplicationStatus,
	val conversionRatePercent: Int
)

data class WorkModeCount(
	val workMode: String,
	val count: Int
)

data class AnalyticsResponse(
	val funnelStages: List<FunnelStageCount>,
	val applicationsOverTime: List<MonthlyApplicationCount>,
	val topTechnologies: List<TechnologyCount>,
	val stageConversionRates: List<StageConversionRate>,
	val applicationsByWorkMode: List<WorkModeCount>
)
