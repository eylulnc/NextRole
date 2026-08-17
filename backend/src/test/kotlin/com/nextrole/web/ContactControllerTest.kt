package com.nextrole.web

import com.fasterxml.jackson.databind.ObjectMapper
import com.ninjasquad.springmockk.MockkBean
import com.nextrole.domain.Contact
import com.nextrole.service.ContactService
import com.nextrole.web.dto.CreateContactRequest
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
import java.util.UUID

@WebMvcTest(ContactController::class)
@AutoConfigureMockMvc(addFilters = false)
class ContactControllerTest {

	@Autowired
	private lateinit var mockMvc: MockMvc

	@Autowired
	private lateinit var objectMapper: ObjectMapper

	@MockkBean
	private lateinit var contactService: ContactService

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
	fun `create returns 201 with the created contact`() {
		val request = CreateContactRequest(name = "Lena Fischer", role = "Talent Partner")
		val created = Contact(applicationId = applicationId, name = "Lena Fischer", role = "Talent Partner")
		every { contactService.create(userId, applicationId, request) } returns created

		mockMvc.post("/api/applications/$applicationId/contacts") {
			contentType = MediaType.APPLICATION_JSON
			content = objectMapper.writeValueAsString(request)
		}.andExpect {
			status { isCreated() }
			jsonPath("$.name") { value("Lena Fischer") }
		}
	}

	@Test
	fun `create rejects a blank name with 400`() {
		mockMvc.post("/api/applications/$applicationId/contacts") {
			contentType = MediaType.APPLICATION_JSON
			content = objectMapper.writeValueAsString(CreateContactRequest(name = ""))
		}.andExpect {
			status { isBadRequest() }
		}
	}

	@Test
	fun `list returns the contacts for an application`() {
		val contacts = listOf(Contact(applicationId = applicationId, name = "Lena Fischer"))
		every { contactService.list(userId, applicationId) } returns contacts

		mockMvc.get("/api/applications/$applicationId/contacts").andExpect {
			status { isOk() }
			jsonPath("$[0].name") { value("Lena Fischer") }
		}
	}
}
