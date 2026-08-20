package com.nextrole.web

import com.fasterxml.jackson.databind.ObjectMapper
import com.ninjasquad.springmockk.MockkBean
import com.nextrole.domain.Note
import com.nextrole.service.NoteService
import com.nextrole.exception.ResourceNotFoundException
import com.nextrole.web.dto.CreateNoteRequest
import com.nextrole.web.dto.UpdateNoteRequest
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
import org.springframework.test.web.servlet.delete
import org.springframework.test.web.servlet.get
import org.springframework.test.web.servlet.patch
import org.springframework.test.web.servlet.post
import java.util.UUID

@WebMvcTest(NoteController::class)
@AutoConfigureMockMvc(addFilters = false)
class NoteControllerTest {

	@Autowired
	private lateinit var mockMvc: MockMvc

	@Autowired
	private lateinit var objectMapper: ObjectMapper

	@MockkBean
	private lateinit var noteService: NoteService

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
	fun `create returns 201 with the created note`() {
		val request = CreateNoteRequest("Great first call.")
		val created = Note(applicationId = applicationId, text = "Great first call.")
		every { noteService.create(userId, applicationId, request) } returns created

		mockMvc.post("/api/applications/$applicationId/notes") {
			contentType = MediaType.APPLICATION_JSON
			content = objectMapper.writeValueAsString(request)
		}.andExpect {
			status { isCreated() }
			jsonPath("$.text") { value("Great first call.") }
		}
	}

	@Test
	fun `create rejects blank text with 400`() {
		mockMvc.post("/api/applications/$applicationId/notes") {
			contentType = MediaType.APPLICATION_JSON
			content = objectMapper.writeValueAsString(CreateNoteRequest(""))
		}.andExpect {
			status { isBadRequest() }
		}
	}

	@Test
	fun `list returns the notes for an application`() {
		val notes = listOf(Note(applicationId = applicationId, text = "First note"))
		every { noteService.list(userId, applicationId) } returns notes

		mockMvc.get("/api/applications/$applicationId/notes").andExpect {
			status { isOk() }
			jsonPath("$[0].text") { value("First note") }
		}
	}

	@Test
	fun `update returns 200 with the updated note`() {
		val noteId = UUID.randomUUID()
		val request = UpdateNoteRequest("Updated note")
		val updated = Note(applicationId = applicationId, text = "Updated note")
		every { noteService.update(userId, applicationId, noteId, request) } returns updated

		mockMvc.patch("/api/applications/$applicationId/notes/$noteId") {
			contentType = MediaType.APPLICATION_JSON
			content = objectMapper.writeValueAsString(request)
		}.andExpect {
			status { isOk() }
			jsonPath("$.text") { value("Updated note") }
		}
	}

	@Test
	fun `update returns 404 when the note is not found`() {
		val noteId = UUID.randomUUID()
		val request = UpdateNoteRequest("Updated note")
		every { noteService.update(userId, applicationId, noteId, request) } throws ResourceNotFoundException("Note", noteId)

		mockMvc.patch("/api/applications/$applicationId/notes/$noteId") {
			contentType = MediaType.APPLICATION_JSON
			content = objectMapper.writeValueAsString(request)
		}.andExpect {
			status { isNotFound() }
		}
	}

	@Test
	fun `delete returns 204`() {
		val noteId = UUID.randomUUID()
		every { noteService.delete(userId, applicationId, noteId) } returns Unit

		mockMvc.delete("/api/applications/$applicationId/notes/$noteId").andExpect {
			status { isNoContent() }
		}
	}
}
