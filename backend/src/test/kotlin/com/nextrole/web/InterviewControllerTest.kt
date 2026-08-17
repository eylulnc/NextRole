package com.nextrole.web

import com.fasterxml.jackson.databind.ObjectMapper
import com.ninjasquad.springmockk.MockkBean
import com.nextrole.domain.Interview
import com.nextrole.service.InterviewService
import com.nextrole.web.dto.CreateInterviewRequest
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
import org.springframework.test.web.servlet.post
import java.time.Instant
import java.util.UUID

@WebMvcTest(InterviewController::class)
@AutoConfigureMockMvc(addFilters = false)
class InterviewControllerTest {

	@Autowired
	private lateinit var mockMvc: MockMvc

	@Autowired
	private lateinit var objectMapper: ObjectMapper

	@MockkBean
	private lateinit var interviewService: InterviewService

	private val userId = UUID.randomUUID()
	private val applicationId = UUID.randomUUID()

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
	fun `create returns 201 with the created interview`() {
		val scheduledAt = Instant.parse("2026-08-20T14:00:00Z")
		val request = CreateInterviewRequest(round = "Technical Interview", scheduledAt = scheduledAt)
		val created = Interview(applicationId = applicationId, round = "Technical Interview", scheduledAt = scheduledAt)
		every { interviewService.create(userId, applicationId, request) } returns created

		mockMvc.post("/api/applications/$applicationId/interviews") {
			contentType = MediaType.APPLICATION_JSON
			content = objectMapper.writeValueAsString(request)
		}.andExpect {
			status { isCreated() }
			jsonPath("$.round") { value("Technical Interview") }
		}
	}

	@Test
	fun `create rejects a blank round with 400`() {
		mockMvc.post("/api/applications/$applicationId/interviews") {
			contentType = MediaType.APPLICATION_JSON
			content = objectMapper.writeValueAsString(CreateInterviewRequest(round = "", scheduledAt = Instant.now()))
		}.andExpect {
			status { isBadRequest() }
		}
	}

	@Test
	fun `list returns the interviews for an application`() {
		val interviews = listOf(Interview(applicationId = applicationId, round = "HR Screen", scheduledAt = Instant.now()))
		every { interviewService.list(userId, applicationId) } returns interviews

		mockMvc.get("/api/applications/$applicationId/interviews").andExpect {
			status { isOk() }
			jsonPath("$[0].round") { value("HR Screen") }
		}
	}
}
