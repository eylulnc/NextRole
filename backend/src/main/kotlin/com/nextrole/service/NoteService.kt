package com.nextrole.service

import com.nextrole.domain.Note
import com.nextrole.repository.NoteRepository
import com.nextrole.web.dto.CreateNoteRequest
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
}