package com.nextrole.repository

import com.nextrole.domain.Interview
import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface InterviewRepository : JpaRepository<Interview, UUID> {
	fun findByApplicationIdOrderByScheduledAtAsc(applicationId: UUID): List<Interview>
}
