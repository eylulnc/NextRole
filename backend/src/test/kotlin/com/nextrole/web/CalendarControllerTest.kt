package com.nextrole.web

import com.ninjasquad.springmockk.MockkBean
import com.nextrole.service.CalendarService
import com.nextrole.web.dto.UpcomingInterviewResponse
import io.mockk.every
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import java.time.Instant
import java.util.UUID

@WebMvcTest(CalendarController::class)
@AutoConfigureMockMvc(addFilters = false)
class CalendarControllerTest {

	@Autowired
	private lateinit var mockMvc: MockMvc

	@MockkBean
	private lateinit var calendarService: CalendarService

	private val userId = UUID.randomUUID()

	@BeforeEach
	fun setUp() {
		val auth = UsernamePasswordAuthenticationToken(userId, null, emptyList())
		SecurityContextHolder.getContext().authentication = auth
	}

	@AfterEach
	fun tearDown() {
		SecurityContextHolder.clearContext()
	}

	@Test
	fun `interviews returns every interview across all applications`() {
		every { calendarService.getInterviews(userId) } returns listOf(
			UpcomingInterviewResponse(
				applicationId = UUID.randomUUID(),
				company = "Acme",
				role = "Engineer",
				round = "HR Screen",
				scheduledAt = Instant.parse("2026-01-01T10:00:00Z")
			)
		)

		mockMvc.get("/api/calendar/interviews").andExpect {
			status { isOk() }
			jsonPath("$[0].company") { value("Acme") }
		}
	}
}
