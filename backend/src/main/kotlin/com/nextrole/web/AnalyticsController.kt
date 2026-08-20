package com.nextrole.web

import com.nextrole.security.CurrentUser
import com.nextrole.service.AnalyticsService
import com.nextrole.web.dto.AnalyticsResponse
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/analytics")
class AnalyticsController(
	private val analyticsService: AnalyticsService
) {

	@GetMapping
	fun analytics(): AnalyticsResponse =
		analyticsService.getAnalytics(CurrentUser.id())
}
