package com.nextrole.web

import com.ninjasquad.springmockk.MockkBean
import com.nextrole.config.CorsProperties
import com.nextrole.config.SecurityConfig
import com.nextrole.security.JwtService
import com.nextrole.service.ApplicationService
import io.mockk.every
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.context.annotation.Import
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get

/**
 * Spring Security answers unauthenticated requests with 403 by default. Clients can't tell that
 * apart from a genuine permission failure, so an expired access token looked like "forbidden"
 * rather than "refresh and try again" — and the web client silently rendered empty pages instead
 * of refreshing. These pin the 401.
 */
@WebMvcTest(ApplicationController::class)
@Import(SecurityConfig::class)
class UnauthenticatedAccessTest {

	@Autowired
	private lateinit var mockMvc: MockMvc

	@MockkBean
	private lateinit var applicationService: ApplicationService

	@MockkBean
	private lateinit var jwtService: JwtService

	// Relaxed: the filter chain is built during context startup, before any `every` could run.
	@MockkBean(relaxed = true)
	private lateinit var corsProperties: CorsProperties

	@Test
	fun `a request with no token is 401, not 403`() {
		mockMvc.get("/api/applications").andExpect { status { isUnauthorized() } }
	}

	@Test
	fun `a request with an expired token is 401, not 403`() {
		every { jwtService.extractUserId(any()) } throws io.jsonwebtoken.ExpiredJwtException(null, null, "expired")

		mockMvc.get("/api/applications") {
			header("Authorization", "Bearer expired-token")
		}.andExpect { status { isUnauthorized() } }
	}
}
