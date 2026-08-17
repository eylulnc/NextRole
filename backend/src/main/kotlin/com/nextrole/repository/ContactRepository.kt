package com.nextrole.repository

import com.nextrole.domain.Contact
import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface ContactRepository : JpaRepository<Contact, UUID> {
	fun findByApplicationIdOrderByCreatedAtAsc(applicationId: UUID): List<Contact>
}
