package com.nextrole.domain

import jakarta.persistence.*
import java.time.Instant
import java.util.UUID

@Entity
@Table(name = "users")
class User(
	@Id
	@Column(nullable = false, updatable = false)
	val id: UUID = UUID.randomUUID(),

	@Column(nullable = false, unique = true)
	var email: String,

	@Column(name = "password_hash", nullable = false)
	var passwordHash: String,

	@Column(nullable = false)
	var language: String = "en",

	@Column(name = "default_currency", nullable = false)
	var defaultCurrency: String = "EUR",

	@Column(name = "interview_reminder_mode", nullable = false)
	var interviewReminderMode: String = "ALWAYS",

	@Column(name = "interview_reminder_hours", nullable = false)
	var interviewReminderHours: Int = 24,

	@Column(name = "interview_reminder_prompted", nullable = false)
	var interviewReminderPrompted: Boolean = false,

	@Column(name = "created_at", nullable = false, updatable = false)
	val createdAt: Instant = Instant.now()
)
