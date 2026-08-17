package com.nextrole.repository

import com.nextrole.domain.Note
import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface NoteRepository : JpaRepository<Note, UUID> {
    fun findByApplicationIdOrderByCreatedAtAsc(applicationId: UUID): List<Note>
}
