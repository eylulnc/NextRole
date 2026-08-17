package com.nextrole.web

import com.nextrole.security.CurrentUser
import com.nextrole.service.DashboardService
import com.nextrole.web.dto.DashboardStatisticsResponse
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/dashboard")
class DashboardController(
	private val dashboardService: DashboardService
) {

	@GetMapping("/statistics")
	fun statistics(): DashboardStatisticsResponse =
		dashboardService.getStatistics(CurrentUser.id())
}
