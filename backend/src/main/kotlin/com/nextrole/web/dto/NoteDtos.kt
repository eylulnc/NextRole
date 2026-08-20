package com.nextrole.web.dto

import com.nextrole.domain.Note
import jakarta.validation.constraints.NotBlank
import java.time.Instant
import java.util.UUID

data class CreateNoteRequest(
    @field:NotBlank val text: String
)

data class UpdateNoteRequest(
    val text: String? = null
)

data class NoteResponse(
    val id: UUID,
    val text: String,
    val createdAt: Instant
)


fun Note.toResponse() = NoteResponse(
    id = id,
    text = text,
    createdAt = createdAt
)