package com.nextrole.web

import com.fasterxml.jackson.databind.ObjectMapper
import com.ninjasquad.springmockk.MockkBean
import com.nextrole.service.AuthService
import com.nextrole.web.dto.AuthResponse
import com.nextrole.web.dto.LoginRequest
import com.nextrole.web.dto.RegisterRequest
import io.mockk.every
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.http.MediaType
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.post

@WebMvcTest(AuthController::class)
@AutoConfigureMockMvc(addFilters = false)
class AuthControllerTest {

	@Autowired
	private lateinit var mockMvc: MockMvc

	@Autowired
	private lateinit var objectMapper: ObjectMapper

	@MockkBean
	private lateinit var authService: AuthService

	@Test
	fun `register returns 201 with a token`() {
		every { authService.register(RegisterRequest("new@example.com", "password123")) } returns
			AuthResponse("fake-jwt-token", "new@example.com")

		mockMvc.post("/api/auth/register") {
			contentType = MediaType.APPLICATION_JSON
			content = objectMapper.writeValueAsString(RegisterRequest("new@example.com", "password123"))
		}.andExpect {
			status { isCreated() }
			jsonPath("$.token") { value("fake-jwt-token") }
		}
	}

	@Test
	fun `register rejects an invalid email with 400`() {
		mockMvc.post("/api/auth/register") {
			contentType = MediaType.APPLICATION_JSON
			content = objectMapper.writeValueAsString(RegisterRequest("not-an-email", "password123"))
		}.andExpect {
			status { isBadRequest() }
		}
	}

	@Test
	fun `login returns 200 with a token`() {
		every { authService.login(LoginRequest("user@example.com", "password123")) } returns
			AuthResponse("fake-jwt-token", "user@example.com")

		mockMvc.post("/api/auth/login") {
			contentType = MediaType.APPLICATION_JSON
			content = objectMapper.writeValueAsString(LoginRequest("user@example.com", "password123"))
		}.andExpect {
			status { isOk() }
			jsonPath("$.email") { value("user@example.com") }
		}
	}
}
