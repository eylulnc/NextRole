package com.nextrole.web

import com.nextrole.security.CurrentUser
import com.nextrole.service.NoteService
import com.nextrole.web.dto.CreateNoteRequest
import com.nextrole.web.dto.NoteResponse
import com.nextrole.web.dto.toResponse
import jakarta.validation.Valid
import org.springframework.http.HttpStatus
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.util.UUID

@RestController
@RequestMapping("/api/applications/{applicationId}/notes")
class NoteController(
    private val noteService: NoteService
) {
    @PostMapping
    fun create(@Valid @RequestBody request: CreateNoteRequest, @PathVariable applicationId: UUID): ResponseEntity<NoteResponse> {
        val note = noteService.create(CurrentUser.id(), applicationId, request)
        return ResponseEntity.status(HttpStatus.CREATED).body(note.toResponse())
    }

    @GetMapping
    fun list(@PathVariable applicationId: UUID): List<NoteResponse> =
        noteService.list(CurrentUser.id(), applicationId).map { it.toResponse() }
}