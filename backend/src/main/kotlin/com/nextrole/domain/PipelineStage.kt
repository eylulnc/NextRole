package com.nextrole.domain

import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

enum class PipelineStageCategory {
	PRE_RESPONSE,
	ACTIVE,
	TERMINAL
}

@Entity
@Table(name = "pipeline_stages")
class PipelineStage(
	@Id
	@Column(nullable = false, updatable = false)
	val id: UUID = UUID.randomUUID(),

	@Column(name = "user_id", nullable = false)
	val userId: UUID,

	@Column(nullable = false)
	val key: String,

	@Column(nullable = false)
	var label: String,

	@Column(name = "order_index", nullable = false)
	var orderIndex: Int,

	@Column(nullable = false)
	var hue: Int,

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	var category: PipelineStageCategory,

	@Column(name = "is_built_in", nullable = false)
	val isBuiltIn: Boolean = false,

	@Column(nullable = false)
	var visible: Boolean = true,

	@Column(name = "created_at", nullable = false, updatable = false)
	val createdAt: Instant = Instant.now()
)
