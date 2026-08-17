package com.nextrole.web

import com.fasterxml.jackson.databind.ObjectMapper
import com.ninjasquad.springmockk.MockkBean
import com.nextrole.domain.Application
import com.nextrole.exception.ApplicationNotFoundException
import com.nextrole.service.ApplicationService
import com.nextrole.web.dto.CreateApplicationRequest
import io.mockk.every
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.PageRequest
import org.springframework.http.MediaType
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.delete
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.post
import java.util.UUID

@WebMvcTest(ApplicationController::class)
@AutoConfigureMockMvc(addFilters = false)
class ApplicationControllerTest {

	@Autowired
	private lateinit var mockMvc: MockMvc

	@Autowired
	private lateinit var objectMapper: ObjectMapper

	@MockkBean
	private lateinit var applicationService: ApplicationService

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
	fun `create returns 201 with the created application`() {
		val request = CreateApplicationRequest(company = "Acme", role = "Backend Engineer")
		val created = Application(userId = userId, company = "Acme", role = "Backend Engineer")
		every { applicationService.create(userId, request) } returns created

		mockMvc.post("/api/applications") {
			contentType = MediaType.APPLICATION_JSON
			content = objectMapper.writeValueAsString(request)
		}.andExpect {
			status { isCreated() }
			jsonPath("$.company") { value("Acme") }
		}
	}

	@Test
	fun `list returns a page of applications`() {
		val application = Application(userId = userId, company = "Acme", role = "Backend Engineer")
		every { applicationService.list(userId, any()) } returns PageImpl(listOf(application), PageRequest.of(0, 20), 1)

		mockMvc.get("/api/applications").andExpect {
			status { isOk() }
			jsonPath("$.content[0].company") { value("Acme") }
		}
	}

	@Test
	fun `get returns 404 when the application is missing`() {
		val id = UUID.randomUUID()
		every { applicationService.get(userId, id) } throws ApplicationNotFoundException(id)

		mockMvc.get("/api/applications/$id").andExpect {
			status { isNotFound() }
		}
	}

	@Test
	fun `delete returns 204`() {
		val id = UUID.randomUUID()
		every { applicationService.delete(userId, id) } returns Unit

		mockMvc.delete("/api/applications/$id").andExpect {
			status { isNoContent() }
		}
	}
}
