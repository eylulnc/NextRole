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

	@Column(name = "created_at", nullable = false, updatable = false)
	val createdAt: Instant = Instant.now()
)
