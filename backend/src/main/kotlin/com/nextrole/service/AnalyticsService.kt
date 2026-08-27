package com.nextrole.service

import com.nextrole.repository.ApplicationRepository
import com.nextrole.repository.ApplicationStatusHistoryRepository
import com.nextrole.repository.PipelineStageRepository
import com.nextrole.web.dto.AnalyticsResponse
import com.nextrole.web.dto.FunnelStageCount
import com.nextrole.web.dto.MonthlyApplicationCount
import com.nextrole.web.dto.StageConversionRate
import com.nextrole.web.dto.TechnologyCount
import com.nextrole.web.dto.WorkModeCount
import org.springframework.stereotype.Service
import java.time.YearMonth
import java.time.ZoneOffset
import java.util.UUID

private const val MONTHS_OF_HISTORY = 6L
private const val TOP_TECHNOLOGIES_LIMIT = 8
private val WORK_MODES = listOf("REMOTE", "HYBRID", "ONSITE")

@Service
class AnalyticsService(
	private val applicationRepository: ApplicationRepository,
	private val statusHistoryRepository: ApplicationStatusHistoryRepository,
	private val pipelineStageRepository: PipelineStageRepository
) {

	fun getAnalytics(userId: UUID): AnalyticsResponse {
		val applications = applicationRepository.findByUserId(userId)
		val stages = pipelineStageRepository.findByUserIdOrderByOrderIndexAsc(userId).filter { it.visible }

		val funnelStages = stages.map { stage ->
			FunnelStageCount(status = stage.key, count = applications.count { it.status == stage.key })
		}

		val currentMonth = YearMonth.now()
		val months = (MONTHS_OF_HISTORY - 1 downTo 0).map { currentMonth.minusMonths(it) }
		// "SAVED" specifically means "not yet applied" — distinct from the PRE_RESPONSE category
		// (which also covers "applied, awaiting response"). SAVED is a built-in stage that can
		// never be deleted, so this literal check is safe long-term.
		val appliedApplications = applications.filter { it.status != "SAVED" }
		val appliedMonths = appliedApplications.map { application ->
			application.applicationDate?.let { YearMonth.from(it) }
				?: YearMonth.from(application.createdAt.atZone(ZoneOffset.UTC))
		}
		val applicationsOverTime = months.map { month ->
			val count = appliedMonths.count { it == month }
			MonthlyApplicationCount(month = month.toString(), count = count)
		}

		val topTechnologies = applications
			.flatMap { (it.techStack ?: "").split(",").map { tech -> tech.trim() }.filter { tech -> tech.isNotEmpty() } }
			.groupingBy { it }
			.eachCount()
			.entries
			.sortedByDescending { it.value }
			.take(TOP_TECHNOLOGIES_LIMIT)
			.map { TechnologyCount(technology = it.key, count = it.value) }

		val history = statusHistoryRepository.findAllByUserIdOrderByApplicationAndTime(userId)
		val enteredByStatus = mutableMapOf<String, Int>()
		val advancedByStatus = mutableMapOf<String, Int>()
		history.groupBy { it.applicationId }.values.forEach { entries ->
			entries.forEachIndexed { index, entry ->
				enteredByStatus[entry.status] = (enteredByStatus[entry.status] ?: 0) + 1
				if (index < entries.size - 1) {
					advancedByStatus[entry.status] = (advancedByStatus[entry.status] ?: 0) + 1
				}
			}
		}
		val stageConversionRates = stages.map { stage ->
			val entered = enteredByStatus[stage.key] ?: 0
			val advanced = advancedByStatus[stage.key] ?: 0
			val rate = if (entered == 0) 0 else (advanced * 100) / entered
			StageConversionRate(status = stage.key, conversionRatePercent = rate)
		}

		val applicationsByWorkMode = WORK_MODES.map { mode ->
			WorkModeCount(workMode = mode, count = applications.count { it.workMode == mode })
		}

		return AnalyticsResponse(
			funnelStages = funnelStages,
			applicationsOverTime = applicationsOverTime,
			topTechnologies = topTechnologies,
			stageConversionRates = stageConversionRates,
			applicationsByWorkMode = applicationsByWorkMode
		)
	}
}
