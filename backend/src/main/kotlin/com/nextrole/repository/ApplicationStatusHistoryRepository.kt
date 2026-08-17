package com.nextrole.repository

import com.nextrole.domain.ApplicationStatusHistory
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.util.UUID

interface ApplicationStatusHistoryRepository : JpaRepository<ApplicationStatusHistory, UUID> {
	fun findByApplicationIdOrderByChangedAtAsc(applicationId: UUID): List<ApplicationStatusHistory>

	@Query(
		"""
		SELECT h FROM ApplicationStatusHistory h
		WHERE h.applicationId IN (SELECT a.id FROM Application a WHERE a.userId = :userId)
		ORDER BY h.changedAt DESC
		"""
	)
	fun findRecentByUserId(@Param("userId") userId: UUID): List<ApplicationStatusHistory>
}
