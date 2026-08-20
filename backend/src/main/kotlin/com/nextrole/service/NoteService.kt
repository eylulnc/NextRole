package com.nextrole.service

import com.nextrole.domain.Note
import com.nextrole.exception.ResourceNotFoundException
import com.nextrole.repository.NoteRepository
import com.nextrole.web.dto.CreateNoteRequest
import com.nextrole.web.dto.UpdateNoteRequest
import org.springframework.stereotype.Service
import java.util.*

@Service
class NoteService(
    private val noteRepository: NoteRepository,
    private val applicationService: ApplicationService
) {
    fun create(userId: UUID, applicationId: UUID, request: CreateNoteRequest): Note {
        applicationService.get(userId, applicationId)
        val note = Note(applicationId = applicationId, text = request.text)
        val saved = noteRepository.save(note)
        return saved
    }

    fun list(userId: UUID, applicationId: UUID): List<Note> {
        applicationService.get(userId, applicationId)
        return noteRepository.findByApplicationIdOrderByCreatedAtAsc(applicationId)
    }

    fun update(userId: UUID, applicationId: UUID, noteId: UUID, request: UpdateNoteRequest): Note {
        val note = get(userId, applicationId, noteId)
        request.text?.let { note.text = it }
        return noteRepository.save(note)
    }

    fun delete(userId: UUID, applicationId: UUID, noteId: UUID) {
        val note = get(userId, applicationId, noteId)
        noteRepository.delete(note)
    }

    private fun get(userId: UUID, applicationId: UUID, noteId: UUID): Note {
        applicationService.get(userId, applicationId)
        val note = noteRepository.findById(noteId).orElse(null)
        if (note == null || note.applicationId != applicationId) {
            throw ResourceNotFoundException("Note", noteId)
        }
        return note
    }
}