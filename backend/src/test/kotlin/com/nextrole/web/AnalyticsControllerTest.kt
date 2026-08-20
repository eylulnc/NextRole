package com.nextrole.web

import com.ninjasquad.springmockk.MockkBean
import com.nextrole.service.AnalyticsService
import com.nextrole.web.dto.AnalyticsResponse
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

@WebMvcTest(AnalyticsController::class)
@AutoConfigureMockMvc(addFilters = false)
class AnalyticsControllerTest {

	@Autowired
	private lateinit var mockMvc: MockMvc

	@MockkBean
	private lateinit var analyticsService: AnalyticsService

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
	fun `analytics returns the aggregated summary`() {
		every { analyticsService.getAnalytics(userId) } returns AnalyticsResponse(
			funnelStages = emptyList(),
			applicationsOverTime = emptyList(),
			topTechnologies = emptyList(),
			stageConversionRates = emptyList(),
			applicationsByWorkMode = emptyList()
		)

		mockMvc.get("/api/analytics").andExpect {
			status { isOk() }
			jsonPath("$.funnelStages") { isEmpty() }
		}
	}
}
