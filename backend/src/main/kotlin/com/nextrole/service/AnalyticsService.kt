package com.nextrole.service

import com.nextrole.domain.ApplicationStatus
import com.nextrole.repository.ApplicationRepository
import com.nextrole.repository.ApplicationStatusHistoryRepository
import com.nextrole.web.dto.AnalyticsResponse
import com.nextrole.web.dto.FunnelStageCount
import com.nextrole.web.dto.MonthlyApplicationCount
import com.nextrole.web.dto.StageConversionRate
import com.nextrole.web.dto.TechnologyCount
import org.springframework.stereotype.Service
import java.time.YearMonth
import java.time.ZoneOffset
import java.util.UUID

private const val MONTHS_OF_HISTORY = 6L
private const val TOP_TECHNOLOGIES_LIMIT = 8

@Service
class AnalyticsService(
	private val applicationRepository: ApplicationRepository,
	private val statusHistoryRepository: ApplicationStatusHistoryRepository
) {

	fun getAnalytics(userId: UUID): AnalyticsResponse {
		val applications = applicationRepository.findByUserId(userId)

		val funnelStages = ApplicationStatus.entries.map { status ->
			FunnelStageCount(status = status, count = applications.count { it.status == status })
		}

		val currentMonth = YearMonth.now()
		val months = (MONTHS_OF_HISTORY - 1 downTo 0).map { currentMonth.minusMonths(it) }
		val applicationsOverTime = months.map { month ->
			val start = month.atDay(1).atStartOfDay(ZoneOffset.UTC).toInstant()
			val end = month.plusMonths(1).atDay(1).atStartOfDay(ZoneOffset.UTC).toInstant()
			val count = applications.count { it.createdAt >= start && it.createdAt < end }
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
		val enteredByStatus = mutableMapOf<ApplicationStatus, Int>()
		val advancedByStatus = mutableMapOf<ApplicationStatus, Int>()
		history.groupBy { it.applicationId }.values.forEach { entries ->
			entries.forEachIndexed { index, entry ->
				enteredByStatus[entry.status] = (enteredByStatus[entry.status] ?: 0) + 1
				if (index < entries.size - 1) {
					advancedByStatus[entry.status] = (advancedByStatus[entry.status] ?: 0) + 1
				}
			}
		}
		val stageConversionRates = ApplicationStatus.entries.map { status ->
			val entered = enteredByStatus[status] ?: 0
			val advanced = advancedByStatus[status] ?: 0
			val rate = if (entered == 0) 0 else (advanced * 100) / entered
			StageConversionRate(status = status, conversionRatePercent = rate)
		}

		return AnalyticsResponse(
			funnelStages = funnelStages,
			applicationsOverTime = applicationsOverTime,
			topTechnologies = topTechnologies,
			stageConversionRates = stageConversionRates
		)
	}
}
