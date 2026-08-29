package com.nextrole.web

import com.fasterxml.jackson.databind.ObjectMapper
import com.ninjasquad.springmockk.MockkBean
import com.nextrole.service.SettingsService
import com.nextrole.web.dto.UpdateUserSettingsRequest
import com.nextrole.web.dto.UserSettingsResponse
import io.mockk.every
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.http.MediaType
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.patch
import java.util.UUID

@WebMvcTest(SettingsController::class)
@AutoConfigureMockMvc(addFilters = false)
class SettingsControllerTest {

	@Autowired
	private lateinit var mockMvc: MockMvc

	@Autowired
	private lateinit var objectMapper: ObjectMapper

	@MockkBean
	private lateinit var settingsService: SettingsService

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
	fun `get returns the current user's settings`() {
		every { settingsService.get(userId) } returns UserSettingsResponse(
			language = "de",
			defaultCurrency = "USD",
			interviewReminderMode = "ALWAYS",
			interviewReminderHours = 24,
			interviewReminderPrompted = false
		)

		mockMvc.get("/api/settings").andExpect {
			status { isOk() }
			jsonPath("$.language") { value("de") }
			jsonPath("$.defaultCurrency") { value("USD") }
		}
	}

	@Test
	fun `update saves and returns the updated settings`() {
		val request = UpdateUserSettingsRequest(language = "tr", defaultCurrency = "TRY")
		every { settingsService.update(userId, request) } returns UserSettingsResponse(
			language = "tr",
			defaultCurrency = "TRY",
			interviewReminderMode = "ALWAYS",
			interviewReminderHours = 24,
			interviewReminderPrompted = false
		)

		mockMvc.patch("/api/settings") {
			contentType = MediaType.APPLICATION_JSON
			content = objectMapper.writeValueAsString(request)
		}.andExpect {
			status { isOk() }
			jsonPath("$.language") { value("tr") }
		}
	}
}
