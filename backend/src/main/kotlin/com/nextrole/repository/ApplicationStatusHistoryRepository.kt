package com.nextrole.repository

import com.nextrole.domain.ApplicationStatusHistory
import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface ApplicationStatusHistoryRepository : JpaRepository<ApplicationStatusHistory, UUID> {
	fun findByApplicationIdOrderByChangedAtAsc(applicationId: UUID): List<ApplicationStatusHistory>
}
