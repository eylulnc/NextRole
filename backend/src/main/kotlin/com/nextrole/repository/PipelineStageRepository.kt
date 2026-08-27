package com.nextrole.repository

import com.nextrole.domain.PipelineStage
import org.springframework.data.jpa.repository.JpaRepository
import java.util.UUID

interface PipelineStageRepository : JpaRepository<PipelineStage, UUID> {
	fun findByUserIdOrderByOrderIndexAsc(userId: UUID): List<PipelineStage>
	fun findByIdAndUserId(id: UUID, userId: UUID): PipelineStage?
	fun findByUserIdAndKey(userId: UUID, key: String): PipelineStage?
	fun existsByUserIdAndKey(userId: UUID, key: String): Boolean
}
