package com.nextrole.domain

import jakarta.persistence.*
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

@Entity
@Table(name = "applications")
class Application(
	@Id
	@Column(nullable = false, updatable = false)
	val id: UUID = UUID.randomUUID(),

	@Column(name = "user_id", nullable = false)
	val userId: UUID,

	@Column(nullable = false)
	var company: String,

	@Column(nullable = false)
	var role: String,

	var location: String? = null,

	@Column(name = "salary_min")
	var salaryMin: Int? = null,

	@Column(name = "salary_max")
	var salaryMax: Int? = null,

	@Column(name = "tech_stack")
	var techStack: String? = null,

	@Column(name = "job_description", columnDefinition = "TEXT")
	var jobDescription: String? = null,

	@Column(name = "application_date")
	var applicationDate: LocalDate? = null,

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	var status: ApplicationStatus = ApplicationStatus.SAVED,

	@Column(columnDefinition = "TEXT")
	var notes: String? = null,

	@Column(name = "created_at", nullable = false, updatable = false)
	val createdAt: Instant = Instant.now(),

	@Column(name = "updated_at", nullable = false)
	var updatedAt: Instant = Instant.now()
)
