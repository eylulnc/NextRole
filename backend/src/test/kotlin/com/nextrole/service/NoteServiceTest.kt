package com.nextrole.service

import com.nextrole.domain.Application
import com.nextrole.domain.Note
import com.nextrole.exception.ApplicationNotFoundException
import com.nextrole.repository.NoteRepository
import com.nextrole.web.dto.CreateNoteRequest
import io.mockk.every
import io.mockk.mockk
import io.mockk.slot
import io.mockk.verify
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import java.util.UUID

class NoteServiceTest {

	private val noteRepository = mockk<NoteRepository>()
	private val applicationService = mockk<ApplicationService>()
	private val noteService = NoteService(noteRepository, applicationService)
	private val userId = UUID.randomUUID()
	private val applicationId = UUID.randomUUID()

	@Test
	fun `create saves a note once ownership is verified`() {
		every { applicationService.get(userId, applicationId) } returns mockk<Application>()
		val savedSlot = slot<Note>()
		every { noteRepository.save(capture(savedSlot)) } answers { savedSlot.captured }

		val result = noteService.create(userId, applicationId, CreateNoteRequest("Great first call."))

		assertEquals(applicationId, savedSlot.captured.applicationId)
		assertEquals("Great first call.", result.text)
	}

	@Test
	fun `create throws when the application is not owned by this user`() {
		every { applicationService.get(userId, applicationId) } throws ApplicationNotFoundException(applicationId)

		assertThrows(ApplicationNotFoundException::class.java) {
			noteService.create(userId, applicationId, CreateNoteRequest("Should not be saved."))
		}
		verify(exactly = 0) { noteRepository.save(any()) }
	}

	@Test
	fun `list returns notes for an owned application`() {
		every { applicationService.get(userId, applicationId) } returns mockk<Application>()
		val notes = listOf(Note(applicationId = applicationId, text = "First note"))
		every { noteRepository.findByApplicationIdOrderByCreatedAtAsc(applicationId) } returns notes

		val result = noteService.list(userId, applicationId)

		assertEquals(1, result.size)
		assertEquals("First note", result[0].text)
	}

	@Test
	fun `list throws when the application is not owned by this user`() {
		every { applicationService.get(userId, applicationId) } throws ApplicationNotFoundException(applicationId)

		assertThrows(ApplicationNotFoundException::class.java) {
			noteService.list(userId, applicationId)
		}
	}
}
