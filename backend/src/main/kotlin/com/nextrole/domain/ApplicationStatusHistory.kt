package com.nextrole.domain

import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "application_status_history")
class ApplicationStatusHistory(
	@Id
	@Column(nullable = false, updatable = false)
	val id: UUID = UUID.randomUUID(),

	@Column(name = "application_id", nullable = false)
	val applicationId: UUID,

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	val status: ApplicationStatus,

	@Column(name = "changed_at", nullable = false, updatable = false)
	val changedAt: Instant = Instant.now()
)
