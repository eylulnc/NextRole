package com.nextrole.repository

import com.nextrole.domain.Interview
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import java.time.Instant
import java.util.UUID

interface InterviewRepository : JpaRepository<Interview, UUID> {
	fun findByApplicationIdOrderByScheduledAtAsc(applicationId: UUID): List<Interview>

	@Query(
		"""
		SELECT i FROM Interview i
		WHERE i.applicationId IN (SELECT a.id FROM Application a WHERE a.userId = :userId)
		AND i.scheduledAt >= :from
		ORDER BY i.scheduledAt ASC
		"""
	)
	fun findUpcomingByUserId(@Param("userId") userId: UUID, @Param("from") from: Instant): List<Interview>

	@Query(
		"""
		SELECT i FROM Interview i
		WHERE i.applicationId IN (SELECT a.id FROM Application a WHERE a.userId = :userId)
		ORDER BY i.scheduledAt ASC
		"""
	)
	fun findAllByUserId(@Param("userId") userId: UUID): List<Interview>
}
