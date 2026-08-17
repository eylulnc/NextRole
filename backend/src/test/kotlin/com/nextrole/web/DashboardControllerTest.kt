package com.nextrole.web

import com.ninjasquad.springmockk.MockkBean
import com.nextrole.service.DashboardService
import com.nextrole.web.dto.DashboardStatisticsResponse
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
import java.util.UUID

@WebMvcTest(DashboardController::class)
@AutoConfigureMockMvc(addFilters = false)
class DashboardControllerTest {

	@Autowired
	private lateinit var mockMvc: MockMvc

	@MockkBean
	private lateinit var dashboardService: DashboardService

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
	fun `statistics returns the dashboard summary`() {
		every { dashboardService.getStatistics(userId) } returns DashboardStatisticsResponse(
			activeApplications = 3,
			applicationsAddedThisMonth = 1,
			interviewsThisWeek = 2,
			responseRatePercent = 50,
			avgDaysInPipeline = 7,
			funnelStages = emptyList(),
			upcomingInterviews = emptyList(),
			recentActivity = emptyList()
		)

		mockMvc.get("/api/dashboard/statistics").andExpect {
			status { isOk() }
			jsonPath("$.activeApplications") { value(3) }
			jsonPath("$.responseRatePercent") { value(50) }
		}
	}
}
