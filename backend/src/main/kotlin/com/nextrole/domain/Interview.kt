package com.nextrole.domain

import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "interviews")
class Interview(
	@Id
	@Column(nullable = false, updatable = false)
	val id: UUID = UUID.randomUUID(),

	@Column(name = "application_id", nullable = false)
	val applicationId: UUID,

	@Column(nullable = false)
	var round: String,

	var interviewer: String? = null,

	@Column(name = "scheduled_at", nullable = false)
	var scheduledAt: Instant,

	var mode: String? = null,

	@Column(columnDefinition = "TEXT")
	var notes: String? = null,

	@Column(name = "created_at", nullable = false, updatable = false)
	val createdAt: Instant = Instant.now()
)
