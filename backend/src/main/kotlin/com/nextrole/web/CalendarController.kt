package com.nextrole.web

import com.nextrole.security.CurrentUser
import com.nextrole.service.CalendarService
import com.nextrole.web.dto.UpcomingInterviewResponse
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/api/calendar")
class CalendarController(
	private val calendarService: CalendarService
) {

	@GetMapping("/interviews")
	fun interviews(): List<UpcomingInterviewResponse> =
		calendarService.getInterviews(CurrentUser.id())
}
